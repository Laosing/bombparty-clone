function random(items: string[]): string {
  return items[(items.length * Math.random()) | 0];
}

function random2Letters(letters: string[]): string {
  let randomLetter = Math.floor(Math.random() * letters.length);
  const secondLetter = letters[randomLetter + 1];
  if (!secondLetter) {
    return random2Letters(letters);
  }
  return letters[randomLetter] + letters[randomLetter + 1];
}

function random3Letters(letters: string[]): string {
  let randomLetter = Math.floor(Math.random() * letters.length);
  if (letters.length === 3) randomLetter = 0;
  const thirdLetter = letters[randomLetter + 2];
  if (!thirdLetter) {
    return random3Letters(letters);
  }
  return (
    letters[randomLetter] +
    letters[randomLetter + 1] +
    letters[randomLetter + 2]
  );
}

function randomLetters(items: string | string[], chance = 0.7): string {
  const letters = [...items];
  if (Math.random() > chance) {
    return random3Letters(letters);
  } else {
    return random2Letters(letters);
  }
}

// const word = random(randomWords)
// console.log(word, randomLetters(word))

// const items = Array.from({ length: 1000 }, () => {
//   return randomLetters(random(randomWords))
// })

// const dupes = items.reduce(
//   (acc, v, i, arr) =>
//     arr.indexOf(v) !== i && acc.indexOf(v) === -1 ? acc.concat(v) : acc,
//   []
// )

// console.log(dupes, dupes.length)

function getRandomLettersFn(word: string) {
  return (chance?: number): [string, string] => {
    return [randomLetters(word, chance), word];
  };
}

export { getRandomLettersFn };
