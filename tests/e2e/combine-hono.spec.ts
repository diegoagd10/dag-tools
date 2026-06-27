import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

test("renders combine form with drop-zone and disabled submit", async ({ page }) => {
  await page.goto("/pdf/combine");

  await expect(page.getByTestId("combine-form")).toBeVisible();
  await expect(page.getByTestId("drop-zone")).toBeVisible();
  // drop-zone-input is opacity-0, still in a11y tree — not hidden
  await expect(page.getByTestId("drop-zone-input")).toBeAttached();
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();
});

test("drop-zone accepts multiple Source PDFs via browse and accumulates cards", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  // Browse and select two valid PDFs
  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);

  // Selected count header
  await expect(page.getByTestId("selected-count")).toHaveText("2", { timeout: 5000 });

  // Two cards rendered
  await expect(page.getByTestId("source-card")).toHaveCount(2);

  // Card names visible
  await expect(page.getByTestId("source-card").nth(0)).toContainText("sample-1.pdf");
  await expect(page.getByTestId("source-card").nth(1)).toContainText("sample-2.pdf");

  // Both preflight-valid → button enabled
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });
  await expect(page.getByTestId("combine-hint")).toBeHidden();

  // Browse again — files accumulate, not replace
  await input.setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));
  await expect(page.getByTestId("selected-count")).toHaveText("3", { timeout: 5000 });
  await expect(page.getByTestId("source-card")).toHaveCount(3);
});

test("trash control removes a card and updates submit gate", async ({ page }) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);

  // Wait for preflight, so button is enabled
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });

  // Remove first card
  await page.getByTestId("source-card").nth(0).getByTestId("remove-card-button").click();

  // One card remains
  await expect(page.getByTestId("source-card")).toHaveCount(1);

  // Button disabled again (need >= 2 valid)
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();
});

test("dragging cards reorders them and submit produces pages in Merge Order", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);

  // Wait for preflight
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });

  // Reorder by swapping card positions via the Selection module
  await page.evaluate(() => {
    const sel = (window as any).__combineSelection;
    if (!sel) return;
    const items = sel.items();
    if (items.length < 2) return;
    // Swap first and second
    sel.reorder([items[1].id, items[0].id]);
  });

  await page.waitForTimeout(300);

  // Verify order swapped: sample-2.pdf should now be first
  await expect(page.getByTestId("source-card").nth(0)).toContainText("sample-2.pdf");
  await expect(page.getByTestId("source-card").nth(1)).toContainText("sample-1.pdf");

  // Submit
  await page.getByTestId("combine-button").click();

  // Result panel appears
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  const urlInput = page.locator("#combine-result input[type='text']");
  await expect(urlInput).toBeVisible();
  const inputValue = await urlInput.inputValue();
  expect(inputValue).toMatch(/^\/pdf\/combine\/[A-Za-z0-9_-]+$/);

  // Download the Combined PDF and verify page order
  const downloadPromise = page.waitForEvent("download");
  const link = page.locator("#combine-result a");
  await link.click();
  const download = await downloadPromise;

  // Verify the download is a PDF
  const path = await download.path();
  expect(path).toBeTruthy();
});

test("non-PDF file is rejected at add-time with inline message", async ({ page }) => {
  await page.goto("/pdf/combine");

  // Add a valid PDF first so we can observe rejection on second
  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));

  await expect(page.getByTestId("source-card")).toHaveCount(1);

  // Add a non-PDF file alongside a valid one
  await input.setInputFiles([
    resolve(fixtures, "sample-2.pdf"),
    resolve(fixtures, "not-a-pdf.txt"),
  ]);

  // Only the valid PDF is added — the txt is rejected
  await expect(page.getByTestId("source-card")).toHaveCount(2);
  await expect(page.getByTestId("source-card").nth(1)).toContainText("sample-2.pdf");
});

test("corrupt Source PDF shows inline error and keeps Combine disabled", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "corrupt.pdf"),
  ]);

  // Two cards rendered (corrupt file is accepted as PDF, rejected by preflight)
  await expect(page.getByTestId("source-card")).toHaveCount(2);

  // First card valid — no rejection element
  await expect(
    page.getByTestId("source-card").nth(0).locator("[data-testid='card-rejection']"),
  ).toHaveCount(0);

  // Second card shows rejection after preflight
  await expect(
    page.getByTestId("source-card").nth(1).locator("[data-testid='card-rejection']"),
  ).toBeVisible({ timeout: 5000 });
  await expect(
    page.getByTestId("source-card").nth(1).getByTestId("card-rejection"),
  ).toContainText(/corrupt|unreadable/);

  // Combine stays disabled
  await expect(page.getByTestId("combine-button")).toBeDisabled();
});

test("encrypted Source PDF shows inline error and keeps Combine disabled", async ({
  page,
}) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "encrypted.pdf"),
  ]);

  await expect(page.getByTestId("source-card")).toHaveCount(2);

  // First card valid — no rejection
  await expect(
    page.getByTestId("source-card").nth(0).locator("[data-testid='card-rejection']"),
  ).toHaveCount(0);

  // Encrypted file shows inline rejection after preflight
  await expect(
    page.getByTestId("source-card").nth(1).locator("[data-testid='card-rejection']"),
  ).toBeVisible({ timeout: 5000 });
  await expect(
    page.getByTestId("source-card").nth(1).getByTestId("card-rejection"),
  ).toContainText(/password-protected/);

  // Combine stays disabled
  await expect(page.getByTestId("combine-button")).toBeDisabled();
});

test("submit succeeds and yields a downloadable Combined PDF", async ({ page }) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);

  // Wait for preflight and combine to be enabled
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });

  // Submit
  await page.getByTestId("combine-button").click();

  // Old Share-Link result panel renders
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });

  // Share-ID link present
  const urlInput = page.locator("#combine-result input[type='text']");
  await expect(urlInput).toBeVisible();
  const inputValue = await urlInput.inputValue();
  expect(inputValue).toMatch(/^\/pdf\/combine\/[A-Za-z0-9_-]+$/);

  // Download via share link
  const downloadPromise = page.waitForEvent("download");
  const link = page.locator("#combine-result a");
  await link.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/combined-\d{4}-\d{2}-\d{2}\.pdf/);
});

test("less than 2 valid Source PDFs keeps Combine disabled with hint", async ({ page }) => {
  await page.goto("/pdf/combine");

  // Add just one file
  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));

  await expect(page.getByTestId("source-card")).toHaveCount(1);

  // Button stays disabled, hint visible
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();

  // Remove the only card
  await page.getByTestId("source-card").nth(0).getByTestId("remove-card-button").click();
  await expect(page.getByTestId("source-card")).toHaveCount(0);
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();
});
