import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

test("PDF Split — File Summary populates from validate preflight on valid Source PDF", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // Summary scaffold is hidden before a file is chosen
  const summary = page.getByTestId("split-file-summary");
  await expect(summary).toBeHidden();

  // Select a valid multi-page Source PDF
  await page.getByTestId("split-file-input").setInputFiles(
    resolve(fixtures, "sample-multi-page.pdf"),
  );

  // Validate preflight fires; summary reveals populated from the response
  await expect(summary).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("split-summary-name")).toHaveText(
    "sample-multi-page.pdf",
  );
  // Meta line: "N Pages • N <unit>" — pageCount from validate, size from the
  // file via formatBytes(). The fixture is tiny (~1 KB) so accept any unit.
  await expect(page.getByTestId("split-summary-meta")).toHaveText(
    /3 pages • \d+(\.\d+)? (B|KB|MB)/,
  );

  // Read-only Task / Mode / Output line — Output count driven by pageCount
  const taskLine = page.getByTestId("split-summary-task-line");
  await expect(taskLine).toContainText("PDF Splitting");
  await expect(taskLine).toContainText("Extract All");
  await expect(page.getByTestId("split-summary-output")).toHaveText(
    "3 Files (.zip)",
  );

  // Split action surfaces the page count
  await expect(page.getByTestId("split-button")).toBeEnabled();
  await expect(page.getByTestId("split-button")).toContainText("3 pages");
});

test("PDF Split — File Summary uses 'File' wording for a single-page Source PDF", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  await page.getByTestId("split-file-input").setInputFiles(
    resolve(fixtures, "sample-1.pdf"),
  );

  const summary = page.getByTestId("split-file-summary");
  await expect(summary).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("split-summary-meta")).toContainText("1 page");
  await expect(page.getByTestId("split-summary-output")).toHaveText(
    "1 File (.zip)",
  );
  await expect(page.getByTestId("split-button")).toContainText("1 page");
});

test("PDF Split — File Summary hides when an invalid file is chosen", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // First load a valid file so the summary is visible
  await page.getByTestId("split-file-input").setInputFiles(
    resolve(fixtures, "sample-multi-page.pdf"),
  );
  await expect(page.getByTestId("split-file-summary")).toBeVisible({
    timeout: 5000,
  });

  // Now pick a non-PDF — summary must hide, rejection shown, button disabled
  await page.getByTestId("split-file-input").setInputFiles(
    resolve(fixtures, "not-a-pdf.txt"),
  );
  await expect(page.getByTestId("split-file-summary")).toBeHidden();
  await expect(page.getByTestId("split-file-rejection")).toBeVisible();
  await expect(page.getByTestId("split-button")).toBeDisabled();
});
