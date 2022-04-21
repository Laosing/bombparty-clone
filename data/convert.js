const { readFileSync, writeFileSync } = require("fs")

const array = readFileSync("wordlist.txt")
  .toString()
  .replace(/\r\n/g, "\n")
  .split("\n")

const obj = array.reduce((acc, cur, i) => {
  acc[cur] = 1
  return acc
}, {})

writeFileSync("wordlist.js", JSON.stringify(obj, null, 2))
