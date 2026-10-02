export function GET(): Response {
  return Response.json({ ok: true, service: 'forge-fitness', time: new Date().toISOString() })
}
