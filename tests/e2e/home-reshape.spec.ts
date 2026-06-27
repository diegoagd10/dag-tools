import { test, expect } from "@playwright/test";

test.describe("Home page reshape S1", () => {
  test("nav PDF Tools link scrolls to PDF Tools section on home", async ({
    page,
  }) => {
    await page.goto("/");
    await page.click('a[href="/#pdf-tools"]');
    await expect(page).toHaveURL(/#pdf-tools/);
    await expect(page.locator("#pdf-tools")).toBeVisible();
  });

  test("nav QR Tools link scrolls to QR Tools section on home", async ({
    page,
  }) => {
    await page.goto("/");
    await page.click('a[href="/#qr-tools"]');
    await expect(page).toHaveURL(/#qr-tools/);
    await expect(page.locator("#qr-tools")).toBeVisible();
  });

  test("Merge card navigates to /pdf/combine", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/pdf/combine"]');
    await expect(page).toHaveURL("/pdf/combine");
  });

  test("Split card navigates to /pdf/split", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/pdf/split"]');
    await expect(page).toHaveURL("/pdf/split");
  });

  test("Generate card navigates to /links/qr", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/links/qr"]');
    await expect(page).toHaveURL("/links/qr");
  });

  test("To-Epub card does not navigate when clicked", async ({ page }) => {
    await page.goto("/");
    // To-Epub should NOT be an <a> element
    const count = await page.locator('a:has-text("To-Epub")').count();
    expect(count).toBe(0);
    // Clicking the div should not change URL
    const toEpubCard = page
      .locator("#pdf-tools")
      .locator("div", { hasText: "To-Epub" })
      .first();
    await toEpubCard.click();
    await expect(page).toHaveURL("/");
  });

  test("from a non-home page, nav QR Tools link navigates to home#qr-tools", async ({
    page,
  }) => {
    await page.goto("/pdf/combine");
    await page.click('a[href="/#qr-tools"]');
    await expect(page).toHaveURL(/\/.*#qr-tools/);
    await expect(page.locator("#qr-tools")).toBeVisible();
  });
});
