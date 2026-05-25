// server/validation/wsSchemas.js
// When adding WebSocket (e.g. socket.io), validate every inbound event with Zod:
//   const schema = z.object({ ... }).strict();
//   socket.on('event', (payload) => { const r = schema.safeParse(payload); ... });
// Apply the same rate limits per socket.id / userId as REST AI routes.

module.exports = {};
