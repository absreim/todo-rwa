import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec)

// TODO: augment this function so that it stops the ASP.NET Core app before
// calling the reseed script to drop the database, and then restart the app
// after reseeding
const reseedDatabase = async () => {
  const { stderr } = await execPromise("npm run reseed")
  if (stderr) {
    throw new Error(`Error reseeding database: ${stderr}`)
  }
}

export default reseedDatabase
