declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "test" | "production";
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {};
