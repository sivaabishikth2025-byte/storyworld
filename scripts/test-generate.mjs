const story = process.argv[2] || "A girl finds a glowing key in a rainy alley."
const res = await fetch("http://127.0.0.1:3001/api/video/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: story }),
})
const text = await res.text()
console.log("status", res.status)
console.log(text)
