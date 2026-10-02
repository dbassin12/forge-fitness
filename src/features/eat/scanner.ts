/** Minimal shape shared by the native BarcodeDetector and the polyfill. */
export interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] as const

let cached: Promise<Detector> | null = null

/**
 * Native BarcodeDetector where available (Android Chrome); otherwise the ZXing WebAssembly
 * polyfill, whose .wasm ships inside the app (no CDN) so scanning works offline too.
 */
export function getDetector(): Promise<Detector> {
  cached ??= (async () => {
    const Native = (globalThis as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector
    if (Native) {
      try {
        const supported = (await Native.getSupportedFormats?.()) ?? []
        if (supported.includes('ean_13')) return new Native({ formats: FORMATS.filter((f) => supported.includes(f)) })
      } catch {
        /* fall back to the polyfill */
      }
    }
    const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ])
    prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } })
    return new BarcodeDetector({ formats: [...FORMATS] }) as unknown as Detector
  })()
  return cached
}
