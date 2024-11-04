import { test as setup } from "@playwright/test"
import { execPromise } from "./util";

setup('build api docker image', async () => {
  setup.slow()
  const dockerBuildPromise = await execPromise("docker build -t e2e .")
  const seedBuildPromise = await execPromise("dotnet build ../api/SeedDatabase/SeedDatabase.csproj")
  const apiBuildPromise = await execPromise("dotnet build ../api/TodoRwa/TodoRwa.csproj")
  
  await Promise.all([dockerBuildPromise, seedBuildPromise, apiBuildPromise])
})
