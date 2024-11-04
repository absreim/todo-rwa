import { APIRequestContext } from "@playwright/test";
import { execPromise, sleep } from "./util";
import { ChildProcess, exec } from "node:child_process";

/*
 * This class is fixture meant to be used with Playwright.
 */
export default class BackEndReset {
  private apiServiceProc: ChildProcess | null = null;
  private readonly parallelIndex: number;
  private readonly request: APIRequestContext;
  private readonly retryIntervalMs: number;
  private readonly retryAttempts: number;

  constructor(
    parallelIndex: number,
    request: APIRequestContext,
    retryIntervalMs: number = 500,
    retryAttempts: number = 10,
  ) {
    this.parallelIndex = parallelIndex;
    this.request = request;
    this.retryIntervalMs = retryIntervalMs;
    this.retryAttempts = retryAttempts;
  }

  private async reseedDatabase() {
    const { stderr } = await execPromise(`export TEST_DB_NAME=${this.getTestDbName()} TEST_DB_CONN_STR='${this.getTestDbConnStr()}'; npm run reseed-for-test`);
    if (stderr) {
      throw new Error(`Error reseeding database: ${stderr}`);
    }
  }

  private async startApiService() {
    const apiEnv = process.env.ASPNETCORE_ENVIRONMENT!;
    
    this.apiServiceProc = exec("npm run start-api-for-test", {
      env: {
        ...process.env,
        NODE_ENV: "test",
        ASPNETCORE_ENVIRONMENT: apiEnv,
        ASPNETCORE_URLS: this.getBackendUrl(),
        DB_CONN_STR: this.getTestDbConnStr()
      }
    })
  }

  private async confirmWebApiRunning() {
    const url = `${this.getBackendUrl()}/api/TodoItems/ping`;
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
    if (this.apiServiceProc) {
      const wasKilled = this.apiServiceProc.kill();
      if (!wasKilled) {
        `Unable to kill API service process with PID ${this.apiServiceProc.pid}. Consider forcefully killing the process before rerunning the test.`
      }
      return;
    }
    
    throw new Error(
      "This fixture was asked to the stop the API service process, but the child process was never initialized. When using this fixture, be sure to call the 'init' method in the spec file's beforeEach hook."
    )
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
  
  private getTestDbName() {
    return `todotest${this.parallelIndex}`
  }
  
  private getTestDbConnStr() {
    return `Host=localhost;Username=todouser;Password=password;Database=${this.getTestDbName()}`
  }
  
  private getBackendPort() {
    return 5000 + this.parallelIndex
  }
  
  private getBackendUrl() {
    return `http://localhost:${this.getBackendPort()}`;
  }
}
