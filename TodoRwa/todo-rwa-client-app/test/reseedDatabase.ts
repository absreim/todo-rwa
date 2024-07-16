import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec)

const reseedDatabase = async () => {
  const { stderr } = await execPromise("npm run reseed")
  if (stderr) {
    throw new Error(`Error reseeding database: ${stderr}`)
  }
}

export default reseedDatabase
