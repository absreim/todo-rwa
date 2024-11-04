import { execPromise, sleep } from "./util"

export default class NextDevServerManager {
  private readonly parallelIndex: number
  private readonly retryIntervalMs: number
  private readonly retryAttempts: number
  
  constructor(parallelIndex: number, retryIntervalMs: number = 500, retryAttempts: number = 10) {
    this.parallelIndex = parallelIndex
    this.retryIntervalMs = retryIntervalMs;
    this.retryAttempts = retryAttempts;
  }
  
  private async startDevServer() {
    const runCmd = `docker run -d -p ${this.getNextDevServerPort()}:3000 -e API_URL='${this.getBackendUrl()}' --name ${this.getDockerName()} e2e`
    await execPromise(runCmd)
  }
  
  private async checkServerRunning() {
    const url = this.getNextDevServerUrl()
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return;
        }
      } catch {
        // Suppress errors because some number of failed attempts is expected
      } finally {
        if (i !== this.retryAttempts - 1) {
          await sleep(this.retryIntervalMs)
        }
      }
    }
    throw new Error(
      `Failed to ping NextJS dev server after ${this.retryAttempts} attempts.`
    )
  }
  
  async init() {
    await this.startDevServer()
    await this.checkServerRunning()
  }
  
  async cleanUp() {
    await this.stopDevServer()
  }
  
  private async stopDevServer() {
    await execPromise(`docker stop ${this.getDockerName()}`)
    await execPromise(`docker rm ${this.getDockerName()}`)
  }
  
  private getBackendPort() {
    return 5000 + this.parallelIndex
  }
  
  private getBackendUrl() {
    return `http://localhost:${this.getBackendPort()}/api`
  }
  
  private getNextDevServerPort() {
    return 3000 + this.parallelIndex;
  }
  
  private getDockerName() {
    return `todo-rwa-server${this.parallelIndex}`
  }
  
  getNextDevServerUrl() {
    return `http://localhost:${this.getNextDevServerPort()}`
  }
}
