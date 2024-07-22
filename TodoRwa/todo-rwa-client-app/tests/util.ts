import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

// TODO: augment this function so that it stops the ASP.NET Core app before
// calling the reseed script to drop the database, and then restart the app
// after reseeding
export const reseedDatabase = async () => {
  const { stderr } = await execPromise("npm run reseed");
  if (stderr) {
    throw new Error(`Error reseeding database: ${stderr}`);
  }
};

export const startWebApi = (env: string, urls: string, dbConnStr: string) => {
  return exec("npm run web-api", {
    env: {
      ...process.env,
      NODE_ENV: "test",
      ASPNETCORE_ENVIRONMENT: env,
      ASPNETCORE_URLS: urls,
      "Postgres:ConnectionString": dbConnStr,
    },
  });
};

export const confirmWebApiRunning = async (
  url: string,
  retryIntervalMs: number = 2000,
  retryAttempts: number = 5,
) => {
  console.log(url);
  for (let i = 0; i < retryAttempts; i++) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
      });
      if (response.ok) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    } catch (e) {
      console.error(e);
      if (e instanceof TypeError && e.cause instanceof AggregateError) {
        e.cause.errors.forEach((err) => console.error("suberror", err));
      }
    }
  }
};
