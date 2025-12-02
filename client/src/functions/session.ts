import {
  uniqueNamesGenerator,
  adjectives,
  animals
} from "unique-names-generator"
import { customAlphabet } from "nanoid"

export const isDevEnv: boolean = process.env.NODE_ENV === "development"

export const log = isDevEnv ? console.log : () => {}

export const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

export const getRandomName = (): string =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })
