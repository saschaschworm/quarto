const env = process.env;
export const PUBLIC_URL = env.NEXT_PUBLIC_URL || "http://127.0.0.1:3000";

export const SECRET_KEY = process.env.SECRET_KEY || "";
export const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

export const REDIS_DSN = process.env.REDIS_DSN || "redis://127.0.0.1:6379/0";

export const SOKETI = {
  ADDRESS: process.env.SOKETI_ADDRESS || env.NEXT_PUBLIC_SOKETI_ADDRESS || "127.0.0.1:6001",
  APP_ID: process.env.SOKETI_APP_ID || "",
  APP_KEY: env.NEXT_PUBLIC_SOKETI_APP_KEY || "",
  APP_SECRET: process.env.SOKETI_APP_SECRET || "",
};
