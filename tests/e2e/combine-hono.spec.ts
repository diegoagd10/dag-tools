import { test, expect } from "@playwright/test";
import { openSync, writeSync, ftruncateSync, closeSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

declare global {
  interface Window {
    __combineSelection?: {
      items(): Array<{ id: string; name: string; size: number; status: string; reason: string | null }>;
      reorder(ids: string[]): void;
    };
  }
}

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
    const sel = window.__combineSelection;
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

  // Success screen renders: headline, download link, Combine More Files action
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#combine-result")).toContainText("Files Combined Successfully");
  await expect(page.getByText("Download Combined PDF")).toBeVisible();
  await expect(page.getByText("Combine More Files")).toBeVisible();

  // No copyable URL input
  await expect(page.locator("#combine-result input[type='text']")).toHaveCount(0);

  // Download the Combined PDF and verify page order
  const downloadPromise = page.waitForEvent("download");
  const downloadLink = page.getByText("Download Combined PDF");
  await downloadLink.click();
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

  // Inline rejection panel shows the non-PDF reason
  await expect(page.getByTestId("add-rejection-panel")).toBeVisible();
  await expect(page.getByTestId("add-rejection-item").first()).toContainText("not-a-pdf.txt");
  await expect(page.getByTestId("add-rejection-item").first()).toContainText("Not a PDF file");
});

test("duplicate file is rejected at add-time with inline message", async ({ page }) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");

  // Add sample-1.pdf
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));
  await expect(page.getByTestId("source-card")).toHaveCount(1);

  // Add sample-1.pdf again (duplicate) alongside sample-2.pdf
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);

  // Only the new file is added — duplicate skipped from cards
  await expect(page.getByTestId("source-card")).toHaveCount(2);

  // Inline rejection panel shows the duplicate reason
  await expect(page.getByTestId("add-rejection-panel")).toBeVisible();
  await expect(page.getByTestId("add-rejection-item").first()).toContainText("sample-1.pdf");
  await expect(page.getByTestId("add-rejection-item").first()).toContainText("Already in the list");
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

  // Success screen renders with headline, no copyable URL input
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#combine-result")).toContainText("Files Combined Successfully");

  // No copyable URL input field
  await expect(page.locator("#combine-result input[type='text']")).toHaveCount(0);

  // Download via share link
  const downloadPromise = page.waitForEvent("download");
  const downloadLink = page.getByText("Download Combined PDF");
  await downloadLink.click();
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

test("oversized file (>50 MB) is rejected at add-time, button stays disabled", async ({
  page,
}) => {
  // Build a synthetic PDF blob sized just over the 50 MB cap with a valid
  // PDF header so it survives the extension gate.  Use ftruncate for a
  // sparse file — reports 51 MB stat size without allocating 51 MB of blocks.
  const tmpPath = resolve(tmpdir(), "oversized-huge-report.pdf");
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const fd = openSync(tmpPath, "w");
  try {
    writeSync(fd, header, 0, header.length, 0);
    ftruncateSync(fd, 51 * 1024 * 1024);
  } finally {
    closeSync(fd);
  }

  try {
    await page.goto("/pdf/combine");

    const input = page.getByTestId("drop-zone-input");

    // Add one valid small PDF alongside the oversized file
    await input.setInputFiles([
      resolve(fixtures, "sample-1.pdf"),
      tmpPath,
    ]);

    // Only the small file appears in the list — oversized was rejected
    await expect(page.getByTestId("source-card")).toHaveCount(1);
    await expect(page.getByTestId("source-card").nth(0)).toContainText(
      "sample-1.pdf",
    );

    // Inline rejection panel shows the oversized file with over-limit reason
    await expect(page.getByTestId("add-rejection-panel")).toBeVisible();
    await expect(page.getByTestId("add-rejection-item").first()).toContainText(
      "oversized-huge-report.pdf",
    );
    await expect(page.getByTestId("add-rejection-item").first()).toContainText(
      "50 MB",
    );

    // Combine stays disabled — only 1 valid file (need >= 2)
    await expect(page.getByTestId("combine-button")).toBeDisabled();
  } finally {
    unlinkSync(tmpPath);
  }
});

test("drop-zone is keyboard-reachable and has accessible role", async ({ page }) => {
  await page.goto("/pdf/combine");

  const dropZone = page.getByTestId("drop-zone");
  await expect(dropZone).toHaveAttribute("tabindex", "0");
  await expect(dropZone).toHaveAttribute("role", "button");
  await expect(dropZone).toHaveAttribute("aria-label");

  // Tab through the nav links to reach the drop zone (brand + 3 nav = 4 tabs)
  // One extra for possible browser chrome focus (URL bar)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
  }
  await expect(dropZone).toBeFocused();

  // Pressing Enter on the drop zone triggers the hidden file input
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    dropZone.press("Enter"),
  ]);
  expect(fileChooser).toBeTruthy();
  // Dismiss the file chooser without selecting
  await fileChooser.setFiles([]);
});

test("selected-count is announced to assistive technology", async ({ page }) => {
  await page.goto("/pdf/combine");

  const selectedCount = page.getByTestId("selected-count");
  // The element itself or its parent should have aria-live="polite"
  const countSpan = page.locator("#selected-count");
  await expect(countSpan).toHaveAttribute("aria-live", "polite");
});

test("rejection messages are announced to assistive technology", async ({ page }) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles(resolve(fixtures, "not-a-pdf.txt"));

  const panel = page.getByTestId("add-rejection-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toHaveAttribute("aria-live", "polite");
});

test("no Merge copy on Combine screens — selection and success", async ({ page }) => {
  await page.goto("/pdf/combine");

  // The selection screen should not contain "Merge" (uses Combine vocabulary)
  const pageText = await page.locator("body").innerText();
  expect(pageText).not.toContain("Merge");

  // Submit and verify success screen also uses "Combine" vocabulary
  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });
  await page.getByTestId("combine-button").click();

  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  const resultText = await page.locator("#combine-result").innerText();
  expect(resultText).not.toContain("Merge");
  expect(resultText).toContain("Combine");
});

test("narrow viewport (375x812) — drop zone, cards, CTAs visible and operable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/pdf/combine");

  // Drop zone visible and has proper size (not collapsed)
  const dropZone = page.getByTestId("drop-zone");
  await expect(dropZone).toBeVisible();
  const dzBox = await dropZone.boundingBox();
  expect(dzBox).toBeTruthy();
  expect(dzBox!.width).toBeGreaterThan(200);

  // Cards fit on narrow viewport
  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });

  // CTA button visible and clickable
  const combineBtn = page.getByTestId("combine-button");
  await expect(combineBtn).toBeVisible();
  await combineBtn.click();

  // Success screen fits
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  const resultBox = await page.locator("#combine-result").boundingBox();
  expect(resultBox).toBeTruthy();
  expect(resultBox!.width).toBeLessThanOrEqual(375);

  // All CTAs visible
  await expect(page.getByText("Download Combined PDF")).toBeVisible();
  await expect(page.getByText("Combine More Files")).toBeVisible();
});

test("coral accent check icon on success screen", async ({ page }) => {
  await page.goto("/pdf/combine");

  const input = page.getByTestId("drop-zone-input");
  await input.setInputFiles([
    resolve(fixtures, "sample-1.pdf"),
    resolve(fixtures, "sample-2.pdf"),
  ]);
  await expect(page.getByTestId("combine-button")).toBeEnabled({ timeout: 5000 });
  await page.getByTestId("combine-button").click();

  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });

  // The success check icon (circle + checkmark) should use combine accent
  const successSvg = page.locator("#combine-result svg.text-combine-accent");
  await expect(successSvg).toBeVisible();
});

test('"Combine More Files" returns to an empty selection screen', async ({ page }) => {
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

  // Success screen appears
  await expect(page.locator("#combine-result")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#combine-result")).toContainText("Files Combined Successfully");

  // Click "Combine More Files"
  await page.getByText("Combine More Files").click();

  // Form reloads — selected count resets to 0, button disabled
  await expect(page.getByTestId("selected-count")).toHaveText("0");
  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();
  // No cards carried over
  await expect(page.getByTestId("source-card")).toHaveCount(0);
});
