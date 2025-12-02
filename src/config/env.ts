import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || "8080",
  nodeEnv: process.env.NODE_ENV || "development",
};
