import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const API = "https://api.worldlabs.ai/marble/v1"
const KEY = process.env.WLT_API_KEY
const WORLD = process.argv[2] || "1b9191b8-af90-46e1-96fd-5852b6d7134f"

const res = await fetch(`${API}/worlds/${WORLD}`, { headers: { "WLT-Api-Key": KEY } })
const data = await res.json()
const world = data.world || data
const urls = world.assets?.splats?.spz_urls || {}
const splatUrl = urls["500k"] || urls["100k"] || urls.full_res
const colliderUrl = world.assets?.mesh?.collider_mesh_url
if (!splatUrl) {
  console.error("no splat url", Object.keys(world.assets || {}))
  process.exit(1)
}

async function save(url, dest) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${dest} ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, buf)
  console.log(dest, buf.length, r.headers.get("content-type"))
}

const splatPath = join("public", "worlds", "marble", `${WORLD}.spz`)
await save(splatUrl, splatPath)
if (colliderUrl) {
  await save(colliderUrl, join("public", "worlds", "marble", `${WORLD}.glb`))
}
writeFileSync(
  join("public", "worlds", "marble", `${WORLD}.json`),
  JSON.stringify(
    {
      worldId: WORLD,
      caption: world.assets?.caption || null,
      marbleUrl: world.world_marble_url,
      scale: world.assets?.splats?.semantics_metadata?.metric_scale_factor || 1,
      ground: world.assets?.splats?.semantics_metadata?.ground_plane_offset || 0,
      splatUrl: `/worlds/marble/${WORLD}.spz`,
      colliderUrl: colliderUrl ? `/worlds/marble/${WORLD}.glb` : null,
    },
    null,
    2,
  ),
)
console.log("meta written")
