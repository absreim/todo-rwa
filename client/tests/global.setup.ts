import { test as setup } from "@playwright/test"
import { execPromise } from "./util";

setup('build api docker image', async () => {
  await execPromise("npm run docker-build-api");
})
