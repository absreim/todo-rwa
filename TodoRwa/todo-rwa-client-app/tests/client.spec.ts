import { test, expect, Locator } from "@playwright/test";
import { confirmWebApiRunning, reseedDatabase, startWebApi } from "./util";
import { TodoItem } from "@/models/dtos";
import { ChildProcess } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Changes need to synced up with SeedDatabase .NET project
const seedData: TodoItem[] = [
  {
    id: 1,
    name: "foo",
    isComplete: false,
  },
  {
    id: 2,
    name: "bar",
    isComplete: true,
  },
  {
    id: 3,
    name: "baz",
    isComplete: true,
  },
];

async function validateGridRow(todoItem: TodoItem, gridRow: Locator) {
  await expect(
    gridRow.getByRole("gridcell", { name: String(todoItem.id) }),
  ).toHaveAttribute("data-field", "id");
  await expect(
    gridRow.getByRole("gridcell", { name: String(todoItem.name) }),
  ).toHaveAttribute("data-field", "name");
  await expect(
    gridRow.getByRole("gridcell", { name: todoItem.isComplete ? "yes" : "no" }),
  ).toHaveAttribute("data-field", "isComplete");
}

let webApiProc: ChildProcess | null = null;

test.beforeEach(async ({ page, request }) => {
  await reseedDatabase();

  const apiEnv = process.env.ASPNETCORE_ENVIRONMENT!;
  const apiUrls = process.env.ASPNETCORE_URLS!;
  const dbConnStr = process.env.DB_CONN_STR!;
  // Use your IDE to include an environment variable DB_CONN_STR that contains
  // the connection string to the PostgreSQL test database

  webApiProc = startWebApi(apiEnv, apiUrls, dbConnStr);
  const pingUrl = `${process.env.NEXT_PUBLIC_API_PATH}/TodoItems/ping`;
  await confirmWebApiRunning(request, pingUrl)

  await page.goto("http://localhost:3000");

  await expect(page.getByRole("grid")).toHaveAttribute(
    "aria-rowcount",
    String(seedData.length + 1),
  );

  const dataRowContainer = page.getByRole("rowgroup");
  const rows = await dataRowContainer.getByRole("row").all();
  for (let i = 0; i < rows.length; i++) {
    await validateGridRow(seedData[i], rows[i]);
  }
});

test.afterEach(async () => {
  // Note that if an error occurs within the context of the Node.js process for Playwright (as opposed to a failed test
  // in the browser) before reaching this point, the spawned .NET API process will likely still be around. In that case,
  // one must manually kill the process before running the test again.
  // 
  // After starting the test through an IDE, the IDE might indicate that a process is still running. In that case, it
  // may be possible to kill the process by simply using a control on the IDE (e.g. the Stop button in JetBrains Rider).
  //
  // A possible enhancement to this repo in the future would be to automate the killing of the API process in the case
  // of an error.
  if (webApiProc) {
    const wasKilled = webApiProc.kill();
    if (!wasKilled) {
      throw Error(
        `Unable to kill web API process with PID ${webApiProc.pid}. Consider forcibly killing the process before rerunning the test.`,
      );
    }
  }
});

test("Add item button exists", async ({ page }) => {
  page.getByRole("button", { name: "ADD TODO ITEM" });
});
