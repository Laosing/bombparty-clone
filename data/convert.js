const { readFileSync, writeFileSync } = require("fs")

const array = readFileSync("gigantic-wordlist.txt")
  .toString()
  .replace(/\r\n/g, "\n")
  .split("\n")

const obj = array.reduce((acc, cur, i) => {
  acc[cur] = 1
  return acc
}, {})

writeFileSync("gigantic-wordlist.js", JSON.stringify(obj, null, 2))
