import "dotenv/config";

export const config = {
  port: Deno.env.get("PORT") || "8080",
  nodeEnv: Deno.env.get("NODE_ENV") || "development",
};
