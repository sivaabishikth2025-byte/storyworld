#!/usr/bin/env node
/**
 * Smoke test: Marble status + asset reachability (no new world generation).
 * Usage: node --env-file=.env.local scripts/e2e-world.mjs [operationId]
 */
const operationId = process.argv[2] || "fa40532b-6124-496f-8a8d-78d8d8f07a60"
const base = process.env.STORYWORLD_URL || "http://127.0.0.1:3001"

const statusRes = await fetch(`${base}/api/world/status?id=${encodeURIComponent(operationId)}`)
const status = await statusRes.json()
if (!statusRes.ok || !status.done || !status.splatUrl) {
  console.error("status failed", status)
  process.exit(1)
}
console.log("status ok", {
  worldId: status.worldId,
  scale: status.scale,
  ground: status.ground,
  hasCollider: Boolean(status.colliderUrl),
})

for (const [label, url] of [
  ["splat", status.splatUrl],
  ["collider", status.colliderUrl],
]) {
  if (!url) continue
  const head = await fetch(url, { method: "HEAD" })
  console.log(label, head.status, head.headers.get("content-length") || "chunked")
  if (!head.ok) process.exit(1)
}

console.log("e2e-world ok")
