import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

test("PDF Split — browse valid Source PDF shows selected-file card and enables CTA", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // Heading correct
  await expect(page.locator("h1")).toHaveText("Split a PDF Document");

  // CTA disabled, hint visible
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
  await expect(page.getByTestId("split-hint")).toBeVisible();

  // Browse a valid multi-page PDF via the hidden file input
  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));

  // Card appears with filename
  const card = page.getByTestId("split-selected-card");
  await expect(card).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("split-card-name")).toHaveText(
    "sample-multi-page.pdf",
  );

  // Card shows page count and size (from preflight)
  await expect(card).toContainText(/3 pages/);

  // CTA enabled, hint hidden
  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });
  await expect(page.getByTestId("split-button")).toContainText("3 pages");
  await expect(page.getByTestId("split-hint")).toBeHidden();
});

test("PDF Split — single-page Source PDF shows card with '1 page' wording and enables CTA", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));

  const card = page.getByTestId("split-selected-card");
  await expect(card).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("split-card-name")).toHaveText("sample-1.pdf");
  await expect(card).toContainText(/1 page/);

  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });
  await expect(page.getByTestId("split-button")).toContainText("1 page");
});

test("PDF Split — replace: selecting a second Source PDF replaces the first", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");

  // Select first PDF
  await input.setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));
  await expect(page.getByTestId("split-selected-card")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId("split-card-name")).toHaveText(
    "sample-multi-page.pdf",
  );

  // Select second PDF (replaces)
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));
  await expect(page.getByTestId("split-card-name")).toHaveText("sample-1.pdf");
  await expect(page.getByTestId("split-selected-card")).toContainText(
    /1 page/,
  );
});

test("PDF Split — remove control clears selection and returns to empty zone", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));

  await expect(page.getByTestId("split-selected-card")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });

  // Click remove
  await page.getByTestId("split-remove-button").click();

  // Card gone, CTA disabled, hint back
  await expect(page.getByTestId("split-selected-card")).toBeHidden();
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
  await expect(page.getByTestId("split-hint")).toBeVisible();
});

test("PDF Split — rejects non-PDF file at add-time with inline message", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "not-a-pdf.txt"));

  // Rejection visible
  const rejection = page.getByTestId("split-file-rejection");
  await expect(rejection).toBeVisible({ timeout: 3000 });
  await expect(rejection).toContainText("not a valid PDF");

  // CTA disabled
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");

  // No card
  await expect(
    page.locator("[data-testid='split-selected-card']"),
  ).not.toBeVisible();
});

test("PDF Split — rejects encrypted PDF via preflight with inline message", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "encrypted.pdf"));

  // Rejection appears after preflight
  const rejection = page.getByTestId("split-file-rejection");
  await expect(rejection).toBeVisible({ timeout: 5000 });
  await expect(rejection).toContainText("password-protected");

  // CTA disabled
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
});

test("PDF Split — rejects corrupt PDF via preflight with inline message", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "corrupt.pdf"));

  // Rejection visible
  const rejection = page.getByTestId("split-file-rejection");
  await expect(rejection).toBeVisible({ timeout: 5000 });
  await expect(rejection).toContainText("corrupt");

  // CTA disabled
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
});

test("PDF Split — CTA gating: disabled until valid selection, enabled after preflight", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // Initially disabled
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
  await expect(page.getByTestId("split-hint")).toBeVisible();

  // Pick a valid PDF
  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "sample-1.pdf"));

  // Enabled after preflight
  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });
  await expect(page.getByTestId("split-button")).toContainText("1 page");
  await expect(page.getByTestId("split-hint")).toBeHidden();
});
