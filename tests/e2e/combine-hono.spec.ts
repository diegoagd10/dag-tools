import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

test("Hono PDF Combine — add row, upload files, reorder, submit, Share Link appears", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  // Should have the combine form
  await expect(page.getByTestId("combine-form")).toBeVisible();

  // Should have 2 initial rows
  await expect(page.getByTestId("source-pdf-row")).toHaveCount(2);

  // Combine button should be disabled with hint visible
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();

  // Click "Add file" to add a third row
  await page.getByTestId("add-file-button").click();

  // Wait for the new row to appear (htmx adds it via beforeend swap)
  await expect(page.getByTestId("source-pdf-row")).toHaveCount(3);

  // Upload files to the first two rows
  const allInputs = page.locator(".source-pdf-row input[type='file']");
  await expect(allInputs).toHaveCount(3);

  // Set files on first row
  await allInputs.nth(0).setInputFiles(resolve(fixtures, "sample-1.pdf"));

  // Wait a moment for the change event to fire
  await page.waitForTimeout(100);

  // Set files on second row
  await allInputs.nth(1).setInputFiles(resolve(fixtures, "sample-2.pdf"));

  // Running total should update
  await expect(page.getByTestId("running-total")).toContainText("/ 50 MB");

  // Combine button should be enabled (2 valid PDFs)
  await expect(page.getByTestId("combine-button")).toBeEnabled();
  await expect(page.getByTestId("combine-hint")).toBeHidden();

  // Reorder rows: drag second row to first position via SortableJS grip
  const rows = page.getByTestId("source-pdf-row");
  const row1 = rows.nth(0);
  const row2 = rows.nth(1);

  // Drag row1 to after row2 (using the sortable-grip)
  await row1.locator(".sortable-grip").dragTo(row2);

  // Submit the form
  await page.getByTestId("combine-button").click();

  // Wait for the result (Share Link panel)
  // htmx swaps #combine-result with the response
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });

  // Should contain a share link in the text input
  const urlInput = page.locator("#combine-result input[type='text']");
  await expect(urlInput).toBeVisible();
  const inputValue = await urlInput.inputValue();
  expect(inputValue).toMatch(/^\/pdf\/combine\/[A-Za-z0-9_-]+$/);

  // Should show a link to open/download
  const link = page.locator("#combine-result a");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/pdf\/combine\/[A-Za-z0-9_-]+$/);
});

test("Hono PDF Combine — each Source PDF shows page count alongside size after preflight", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  const rows = page.getByTestId("source-pdf-row");
  const inputs = page.locator(".source-pdf-row input[type='file']");

  // Select a 3-page and a 2-page Source PDF
  await inputs.nth(0).setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));
  await inputs.nth(1).setInputFiles(resolve(fixtures, "sample-2.pdf"));

  // Each row shows its page count (from the validate preflight) next to size
  await expect(rows.nth(0).getByTestId("page-count")).toBeVisible({
    timeout: 5000,
  });
  await expect(rows.nth(0).getByTestId("page-count")).toHaveText("3 pages");
  await expect(rows.nth(0).getByTestId("file-size")).toBeVisible();

  await expect(rows.nth(1).getByTestId("page-count")).toBeVisible({
    timeout: 5000,
  });
  await expect(rows.nth(1).getByTestId("page-count")).toHaveText("2 pages");
  await expect(rows.nth(1).getByTestId("file-size")).toBeVisible();

  // Both rows preflight-valid — Combine enabled
  await expect(page.getByTestId("combine-button")).toBeEnabled();
});

test("Hono PDF Combine — corrupt Source PDF shows size only, inline error, no page count", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  const rows = page.getByTestId("source-pdf-row");
  const inputs = page.locator(".source-pdf-row input[type='file']");

  // First row valid, second row corrupt
  await inputs.nth(0).setInputFiles(resolve(fixtures, "sample-1.pdf"));
  await inputs.nth(1).setInputFiles(resolve(fixtures, "corrupt.pdf"));

  // First row: page count present
  await expect(rows.nth(0).getByTestId("page-count")).toBeVisible({
    timeout: 5000,
  });

  // Second row: size shown, page count never faked, inline error shown
  await expect(rows.nth(1).getByTestId("file-size")).toBeVisible();
  await expect(rows.nth(1).getByTestId("page-count")).toBeHidden();
  await expect(rows.nth(1).locator(".rejection-msg")).toContainText(
    /corrupt or unreadable/,
  );

  // A rejected row blocks Combine
  await expect(page.getByTestId("combine-button")).toBeDisabled();
});
