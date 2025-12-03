// Bun automatically loads .env files, so no need for dotenv

export const config = {
  port: process.env.PORT || "8080",
  nodeEnv: process.env.NODE_ENV || "development",
}
