const story =
  process.argv[2] ||
  "A young astronaut wakes inside a quiet orbital habitat. Soft blue lights flicker. She floats to a window and looks at Earth while a distant corridor light pulses."

console.log("starting generate...")
const res = await fetch("http://127.0.0.1:3001/api/video/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: story, safer: true, attempt: 1 }),
})
const data = await res.json()
console.log("generate", res.status, data)
if (!data.invocationArn) process.exit(1)

for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 10000))
  const st = await fetch(`http://127.0.0.1:3001/api/video/status?arn=${encodeURIComponent(data.invocationArn)}`)
  const job = await st.json()
  console.log(i, job.status, job.failureMessage || "", job.videoUrl ? "HAS_URL" : "")
  if (job.status === "Completed" || job.status === "Failed") {
    console.log(JSON.stringify(job, null, 2))
    break
  }
}
