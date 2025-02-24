import "next";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SECRET_KEY: string;
      ACCESS_TOKEN: string;

      REDIS_DSN: string;

      SOKETI_ADDRESS_EXTERNAL: string;
      SOKETI_ADDRESS_INTERNAL: string;
      SOKETI_APP_ID: string;
      SOKETI_APP_KEY: string;
      SOKETI_APP_SECRET: string;
    }
  }
}
