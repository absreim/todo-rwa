import { expect, test } from "@playwright/test";

test("locators work across remounts", async ({ page }) => {
  await page.goto("http://localhost:3000/experiment");
  await expect(page.locator("p")).toHaveText("after")
})
