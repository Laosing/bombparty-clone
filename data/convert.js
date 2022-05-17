const { readFileSync, writeFileSync } = require("fs")

function convertFile(file) {
  const array = readFileSync(`${file}.txt`)
    .toString()
    .replace(/\r\n/g, "\n")
    .split("\n")

  const obj = array.reduce((acc, cur, i) => {
    if (cur.length >= 3) {
      acc[cur.toLowerCase()] = 1
    }
    return acc
  }, {})

  writeFileSync(`${file}.json`, JSON.stringify(obj, null, 2))
}

// convertFile("sowpods")
// convertFile("popular")

// const p = require("./wordlist.json")
// const s = require("./test.json")

// const g = { ...p, ...s }
// writeFileSync(`wordlist2.json`, JSON.stringify(g, null, 2))
