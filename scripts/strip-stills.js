const fs = require("fs")
const p = "C:/Users/abhip/storyworld/src/lib/director.ts"
let s = fs.readFileSync(p, "utf8")
s = s.replace(/\n\s*still: "[^"]+",/g, "")
s = s.replace(/\n\s*kenBurns: \{[^}]+\},/g, "")
fs.writeFileSync(p, s)
console.log("stills left", (s.match(/still:/g) || []).length)
