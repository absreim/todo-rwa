import { APIRequestContext } from "@playwright/test";
import { execPromise, sleep } from "./util";

/*
 * This class is fixture meant to be used with Playwright.
 */
export default class BackEndReset {
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
    const { stderr } = await execPromise("npm run reseed");
    if (stderr) {
      throw new Error(`Error reseeding database: ${stderr}`);
    }
  }

  private async startApiService() {
    // Use your IDE to include an environment variable DB_CONN_STR that contains
    // the connection string to the PostgreSQL test database
    const dbConnStr = process.env.DB_CONN_STR!;
    const { stderr } = await execPromise("npm run docker-test-api", {
      env: {
        ...process.env,
        DB_CONN_STR: dbConnStr,
      },
    });

    if (stderr) {
      throw new Error(`Error starting Docker container: ${stderr}`);
    }
  }

  private async confirmWebApiRunning() {
    const url = `${process.env.NEXT_PUBLIC_API_PATH}/TodoItems/ping`;
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        const response = await this.request.head(url);
        if (response.ok()) {
          return;
        }
      } catch {
        // Suppress errors because some number of failed attempts are expected
      } finally {
        if (i !== this.retryAttempts - 1) {
          await sleep(this.retryIntervalMs)
        }
      }
    }
    throw new Error(
      `Failed to ping web API after ${this.retryAttempts} attempts.`,
    );
  }

  private async stopApiService() {
    const { stderr: stopStdErr } = await execPromise("npm run docker-stop-test-api");
    if (stopStdErr) {
      throw new Error(`Error stopping Docker container: ${stopStdErr}`);
    }

    const { stderr: rmStdErr } = await execPromise("npm run docker-rm-test-api");
    if (rmStdErr) {
      throw new Error(`Error removing Docker container: ${rmStdErr}`);
    }
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
