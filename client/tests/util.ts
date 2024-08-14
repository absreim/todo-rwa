import { exec } from "node:child_process";
import { promisify } from "node:util";
import { APIRequestContext } from "@playwright/test"

const execPromise = promisify(exec);

export const reseedDatabase = async () => {
  const { stderr } = await execPromise("npm run reseed");
  if (stderr) {
    throw new Error(`Error reseeding database: ${stderr}`);
  }
};

export const startWebApi = (env: string, urls: string, dbConnStr: string) => {
  return exec("npm run start-api", {
    env: {
      ...process.env,
      NODE_ENV: "test",
      ASPNETCORE_ENVIRONMENT: env,
      ASPNETCORE_URLS: urls,
      DB_CONN_STR: dbConnStr,
    },
  });
};

export const confirmWebApiRunning = async (
  request: APIRequestContext,
  url: string,
  retryIntervalMs: number = 500,
  retryAttempts: number = 10,
) => {
  for (let i = 0; i < retryAttempts; i++) {
    try {
      const response = await request.head(url);
      if (response.ok()) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    } catch {
      console.log(`Waiting for API to start up. Attempt number ${i + 1}.`)
    }
  }
};
