import { test as base, expect, Locator, Page } from "@playwright/test";
import { TodoItem } from "@/models/dtos";
import BackEndReset from "./BackEndReset";

// Changes need to be synced up with SeedDatabase .NET project
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
  await expect(gridRow.locator('div[data-field="isComplete"]'))
    .toHaveAccessibleName(todoItem.isComplete ? "yes" : "no")
}

async function addRow(todoItem: TodoItem, page: Page) {
  await page.getByRole("button", { name: "ADD TODO ITEM" }).click();
  const dataRowContainer = page.getByRole("rowgroup");
  const addedRow = dataRowContainer.getByRole("row").filter({ has: page.getByRole("gridcell", { name: String(todoItem.id), exact: true }) });
  await addedRow.getByRole("textbox").fill(todoItem.name)
  if (todoItem.isComplete) {
    await addedRow.getByRole("checkbox").check()
  }
  await addedRow.getByRole("menuitem", { name: "Save" }).click();

  await expect(page.getByRole("rowgroup").getByRole("row").filter({
    has: page.getByRole("gridcell", { name: String(todoItem.id), exact: true }) })
    .locator('div[data-field="synced"]')
  ).toHaveAccessibleName("yes")
}

async function editRow(todoItem: TodoItem, page: Page) {
  const rowToEdit = page.getByRole("rowgroup").getByRole("row").filter({ has: page.getByRole("gridcell", { name: String(todoItem.id), exact: true }) });
  await rowToEdit.getByRole("menuitem", { name: "Edit" }).click()
  await rowToEdit.getByRole("textbox").fill(todoItem.name)
  const isCompleteBox = rowToEdit.getByRole("checkbox")
  await (todoItem.isComplete ? isCompleteBox.check() : isCompleteBox.uncheck())
  await rowToEdit.getByRole("menuitem", { name: "Save" }).click();
  await expect(rowToEdit.locator('div[data-field="synced"]')).toHaveAccessibleName("yes")
  await validateGridRow(todoItem, rowToEdit)
}

const test = base.extend<{ backEndReset: BackEndReset }>({
  backEndReset: async ({ request }, use) => {
    const backEndReset = new BackEndReset(request)
    await use(backEndReset)
  }
})

test.beforeEach(async ({ page, backEndReset }) => {
  await backEndReset.init()

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

test.afterEach(async ({ backEndReset }) => {
  await backEndReset.cleanUp()
});

test("Adding items works", async ({ page }) => {
  const itemsToAdd: TodoItem[] = [
    {
      id: 4,
      name: "fizz",
      isComplete: false
    },
    {
      id: 5,
      name: "buzz",
      isComplete: true
    }
  ]
  
  for (const item of itemsToAdd) {
    await addRow(item, page)
  }

  const dataRowContainer = page.getByRole("rowgroup");
  const rows = await dataRowContainer.getByRole("row").all();
  const expectedData = seedData.concat(itemsToAdd)
  for (let i = 0; i < rows.length; i++) {
    await validateGridRow(expectedData[i], rows[i]);
  }
});

test("Editing items works", async ({ page }) => {
  const postEditItems: TodoItem[] = [
    {
      id: 1,
      name: "fizz",
      isComplete: true
    },
    {
      id: 2,
      name: "buzz",
      isComplete: false
    },
    {
      id: 3,
      name: "baz",
      isComplete: false
    }
  ]
  
  for (const item of postEditItems) {
    await editRow(item, page)
  }
})
