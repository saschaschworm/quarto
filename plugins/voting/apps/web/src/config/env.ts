export const SECRET_KEY = process.env.SECRET_KEY || "";
export const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

export const REDIS_DSN = process.env.REDIS_DSN || "redis://127.0.0.1:6379/0";

export const SOKETI = {
  APP_ID: process.env.SOKETI_APP_ID || "",
  APP_KEY: process.env.SOKETI_APP_KEY || "",
  APP_SECRET: process.env.SOKETI_APP_SECRET || "",
  ADDRESS: {
    EXTERNAL: process.env.SOKETI_ADDRESS_EXTERNAL || "127.0.0.1:6001",
    INTERNAL: process.env.SOKETI_ADDRESS_INTERNAL || "127.0.0.1:6001",
  },
};
