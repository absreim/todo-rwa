import { test, expect, Locator } from "@playwright/test";
import reseedDatabase from "./reseedDatabase";
import { TodoItem } from "@/models/dtos";

// Changes need to synced up with SeedDatabase .NET project
const seedData: TodoItem[] = [
  {
    id: 1,
    name: "foo",
    isComplete: false
  },
  {
    id: 2,
    name: "bar",
    isComplete: true
  },
  {
    id: 3,
    name: "baz",
    isComplete: true
  }
]

async function validateGridRow(todoItem: TodoItem, gridRow: Locator) {
  await expect(gridRow.getByRole("gridcell", { name: String(todoItem.id) })).toHaveAttribute("data-field", "id")
  await expect(gridRow.getByRole("gridcell", { name: String(todoItem.name) })).toHaveAttribute("data-field", "name")
  await expect(gridRow.getByRole("gridcell", { name: todoItem.isComplete ? "yes" : "no" })).toHaveAttribute("data-field", "isComplete")
}

test.beforeEach(async ({ page }) => {
  await reseedDatabase()
  
  await page.goto("http://localhost:3000")
  
  await expect(page.getByRole("grid")).toHaveAttribute("aria-rowcount", String(seedData.length + 1))
  
  const dataRowContainer = page.getByRole("rowgroup")
  const rows = await dataRowContainer.getByRole("row").all()
  for (let i = 0; i < rows.length; i++) {
    await validateGridRow(seedData[i], rows[i])
  }
})

test("Add item button exists", async ({ page }) => {
  page.getByRole("button", { name: "ADD TODO ITEM" })
})
