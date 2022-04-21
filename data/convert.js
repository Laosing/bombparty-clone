const { readFileSync, writeFileSync } = require("fs")
const { keyBy } = require("lodash")

// const array = readFileSync("wordlist.txt")
//   .toString()
//   .replace(/\r\n/g, "\n")
//   .split("\n")

// const obj = array.reduce((acc, cur, i) => {
//   acc[cur] = 1
//   return acc
// }, {})

// writeFileSync("wordlist.js", JSON.stringify(obj, null, 2))

// const json = readFileSync("wordlist.json")
// const obj = JSON.parse(json)
// const arr = Object.keys(obj).filter((word) => word.length >= 3)
// const t = keyBy(arr, (o) => {
//   console.log(o)
//   return o.toLowerCase().charAt(0)
// })
// console.log({ t })

//   .toString()
//   .replace(/\r\n/g, "\n")
//   .split("\n")

// const obj = array.reduce((acc, cur, i) => {
//   acc[cur] = 1
//   return acc
// }, {})
