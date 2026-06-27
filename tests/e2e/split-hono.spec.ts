import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

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

test("PDF Split — successful split renders success fragment with download link and Return to Split Tool resets to empty screen", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // Select a valid PDF
  const input = page.getByTestId("split-file-input");
  await input.setInputFiles(resolve(fixtures, "sample-multi-page.pdf"));

  // Wait for card and enabled CTA
  await expect(page.getByTestId("split-selected-card")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });

  // Submit the split
  await page.getByTestId("split-button").click();

  // Wait for the success fragment to appear (replaces #split-result via htmx)
  await expect(page.locator("#split-result")).toContainText(
    "Files Split Successfully",
    { timeout: 15000 },
  );

  // Assert download link target is /pdf/split/:id
  const downloadLink = page.locator("#split-result a[download]");
  await expect(downloadLink).toBeVisible({ timeout: 5000 });
  const href = await downloadLink.getAttribute("href");
  expect(href).toMatch(/\/pdf\/split\/[A-Za-z0-9_-]{12}/);

  // Assert presence of primary action text
  await expect(page.locator("#split-result")).toContainText(
    "Download Files (ZIP)",
  );

  // Assert presence of secondary action
  const returnLink = page.locator("#split-result a", {
    hasText: "Return to Split Tool",
  });
  await expect(returnLink).toBeVisible();
  expect(await returnLink.getAttribute("href")).toBe("/pdf/split");

  // Click Return to Split Tool
  await returnLink.click();
  await page.waitForURL("/pdf/split");

  // Assert we're back on a fresh split page with drop zone visible
  await expect(page.getByTestId("drop-zone")).toBeVisible({ timeout: 5000 });
  // Assert heading is correct
  await expect(page.locator("h1")).toHaveText("Split a PDF Document");
  // Assert CTA is disabled (no carried-over selection)
  await expect(page.getByTestId("split-button")).toBeDisabled();
  await expect(page.getByTestId("split-button")).toHaveText("Split PDF");
  // Assert no selected-file card (fresh load)
  await expect(page.getByTestId("split-selected-card")).toBeHidden();
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

test("PDF Split — drag-and-drop valid PDF onto drop zone shows card and enables CTA", async ({
  page,
}) => {
  await page.goto("/pdf/split");

  // Wait for JS controller to initialise
  await page.waitForFunction(() => window.__splitSelection !== undefined);

  // Read fixture PDF and pass as base64 to the browser
  const pdfPath = resolve(fixtures, "sample-multi-page.pdf");
  const pdfBuffer = readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString("base64");

  // Dispatch real drag-and-drop events on the drop zone
  await page.evaluate(
    ({ base64, name, mime }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mime });
      const file = new File([blob], name, { type: mime });

      const dt = new DataTransfer();
      dt.items.add(file);

      const zone = document.querySelector("[data-testid='drop-zone']");
      if (!zone) throw new Error("drop-zone not found");

      for (const type of ["dragenter", "dragover"]) {
        zone.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
          }),
        );
      }

      zone.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        }),
      );
    },
    {
      base64: pdfBase64,
      name: "sample-multi-page.pdf",
      mime: "application/pdf",
    },
  );

  // Card appears with filename, page-count, and size
  const card = page.getByTestId("split-selected-card");
  await expect(card).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("split-card-name")).toHaveText(
    "sample-multi-page.pdf",
  );
  await expect(card).toContainText(/3 pages/);

  // CTA enabled, hint hidden
  await expect(page.getByTestId("split-button")).toBeEnabled({ timeout: 5000 });
  await expect(page.getByTestId("split-button")).toContainText("3 pages");
  await expect(page.getByTestId("split-hint")).toBeHidden();
});
