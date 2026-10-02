import { create } from 'zustand'

/** The line currently being spoken (or that would be, when voice is off). */
export const useCaption = create<{ text: string; set: (text: string) => void; clear: () => void }>((set) => ({
  text: '',
  set: (text) => set({ text }),
  clear: () => set({ text: '' }),
}))
