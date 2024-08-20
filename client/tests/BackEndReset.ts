import { promisify } from "node:util";
import { ChildProcess, exec } from "node:child_process";
import { APIRequestContext } from "@playwright/test";

/*
 * This class is fixture meant to be used with Playwright.
 */
export default class BackEndReset {
  private apiServiceProc: ChildProcess | null = null;
  private readonly request: APIRequestContext;
  private readonly retryIntervalMs: number;
  private readonly retryAttempts: number;

  constructor(
    request: APIRequestContext,
    retryIntervalMs: number = 500,
    retryAttempts: number = 10,
  ) {
    this.request = request;
    this.retryIntervalMs = retryIntervalMs;
    this.retryAttempts = retryAttempts;
  }

  private async reseedDatabase() {
    const execPromise = promisify(exec);
    const { stderr } = await execPromise("npm run reseed");
    if (stderr) {
      throw new Error(`Error reseeding database: ${stderr}`);
    }
  }

  private async startApiService() {
    const apiEnv = process.env.ASPNETCORE_ENVIRONMENT!;
    const apiUrls = process.env.ASPNETCORE_URLS!;

    // Use your IDE to include an environment variable DB_CONN_STR that contains
    // the connection string to the PostgreSQL test database
    const dbConnStr = process.env.DB_CONN_STR!;

    this.apiServiceProc = exec("npm run start-api", {
      env: {
        ...process.env,
        NODE_ENV: "test",
        ASPNETCORE_ENVIRONMENT: apiEnv,
        ASPNETCORE_URLS: apiUrls,
        DB_CONN_STR: dbConnStr,
      },
    });
  }

  private async confirmWebApiRunning() {
    const url = `${process.env.NEXT_PUBLIC_API_PATH}/TodoItems/ping`;
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        const response = await this.request.head(url);
        if (response.ok()) {
          return;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.retryIntervalMs),
        );
      } catch {
        // Suppress errors because some number of failed attempts are expected
      }
    }
    throw new Error(
      `Failed to ping web API after ${this.retryAttempts} attempts.`,
    );
  }

  private async stopApiService() {
    if (this.apiServiceProc) {
      const wasKilled = this.apiServiceProc.kill();
      if (!wasKilled) {
        throw Error(
          `Unable to kill API service process with PID ${this.apiServiceProc.pid}. Consider forcibly killing the process before rerunning the test.`,
        );
      }
      return;
    }

    throw new Error(
      "The fixture was asked to stop the API service process, but the child process instance was never initialized. When using this fixture, be sure to call the 'init' method in the spec file's beforeEach hook.",
    );
  }

  /*
   * Await this method in a test spec's beforeEach hook to reseed the database, start the API service, and confirm that
   * the API service is ready to accept requests.
   */
  async init() {
    await this.reseedDatabase();
    await this.startApiService();
    await this.confirmWebApiRunning();
  }

  async cleanUp() {
    await this.stopApiService();
  }
}
