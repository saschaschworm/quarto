import "next";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_URL: string;
      NEXT_PUBLIC_SOKETI_ADDRESS: string;
      NEXT_PUBLIC_SOKETI_APP_KEY: string;

      SECRET_KEY: string;
      ACCESS_TOKEN: string;

      REDIS_DSN: string;

      SOKETI_ADDRESS: string;
      SOKETI_APP_ID: string;
      SOKETI_APP_SECRET: string;
    }
  }
}
