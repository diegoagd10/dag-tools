import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { PDFDocument } from "pdf-lib";

const fixtures = (name: string) =>
  resolve(process.cwd(), "tests", "fixtures", name);

test("home → upload 2 PDFs → combine → result → download a valid Combined PDF", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("tool-card-combine-pdf")).toBeVisible();
  await page.getByTestId("open-combine-pdf").click();
  await page.waitForURL("**/tools/combine-pdf");

  await expect(page.getByTestId("combine-button")).toBeDisabled();

  await page
    .getByTestId("pdf-file-input")
    .setInputFiles([fixtures("sample-1.pdf"), fixtures("sample-2.pdf")]);

  const list = page.getByTestId("source-pdf-list");
  await expect(list).toBeVisible();
  await expect(list.locator("li")).toHaveCount(2);
  await expect(page.getByText("sample-1.pdf")).toBeVisible();
  await expect(page.getByText("sample-2.pdf")).toBeVisible();

  await expect(page.getByTestId("combine-button")).toBeEnabled();
  await page.getByTestId("combine-button").click();

  await page.waitForURL("**/tools/combine-pdf/result");

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("download-button").click(),
  ]).then(([d]) => d);

  const destination = resolve(tmpdir(), `combined-${Date.now()}.pdf`);
  await download.saveAs(destination);
  const bytes = await readFile(destination);

  expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");

  const combined = await PDFDocument.load(bytes);
  expect(combined.getPageCount()).toBe(3);
});

test("reordering Source PDFs changes the Combined PDF page order", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("open-combine-pdf").click();
  await page.waitForURL("**/tools/combine-pdf");

  await page
    .getByTestId("pdf-file-input")
    .setInputFiles([fixtures("sample-1.pdf"), fixtures("sample-2.pdf")]);

  const rows = page.getByTestId("source-pdf-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("sample-1.pdf");
  await expect(rows.nth(1)).toContainText("sample-2.pdf");

  await rows.nth(0).dragTo(rows.nth(1));

  await expect(rows.nth(0)).toContainText("sample-2.pdf");
  await expect(rows.nth(1)).toContainText("sample-1.pdf");

  await page.getByTestId("combine-button").click();
  await page.waitForURL("**/tools/combine-pdf/result");

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("download-button").click(),
  ]).then(([d]) => d);

  const destination = resolve(tmpdir(), `combined-reordered-${Date.now()}.pdf`);
  await download.saveAs(destination);
  const combined = await PDFDocument.load(await readFile(destination));

  const firstPage = combined.getPage(0);
  expect(firstPage.getWidth()).toBe(842);
  expect(firstPage.getHeight()).toBe(595);
  expect(combined.getPageCount()).toBe(3);
});

test("a non-PDF is rejected inline and keeps the Combine button disabled", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("open-combine-pdf").click();
  await page.waitForURL("**/tools/combine-pdf");

  await page.getByTestId("pdf-file-input").setInputFiles([
    fixtures("sample-1.pdf"),
    fixtures("not-a-pdf.txt"),
  ]);

  const rows = page.getByTestId("source-pdf-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("sample-1.pdf");
  await expect(rows.nth(1)).toContainText("not-a-pdf.txt");

  await expect(
    page.getByText("This file is not a valid PDF"),
  ).toBeVisible();

  await expect(page.getByTestId("running-total")).toContainText("/ 50 MB");

  await expect(page.getByTestId("combine-button")).toBeDisabled();
  await expect(page.getByTestId("combine-hint")).toBeVisible();
});

test("Combine more resets the store and returns to an empty tool page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("open-combine-pdf").click();
  await page.waitForURL("**/tools/combine-pdf");

  await page
    .getByTestId("pdf-file-input")
    .setInputFiles([fixtures("sample-1.pdf"), fixtures("sample-2.pdf")]);

  await page.getByTestId("combine-button").click();
  await page.waitForURL("**/tools/combine-pdf/result");

  await expect(page.getByTestId("combined-filename")).toContainText(
    "combined-",
  );
  await expect(page.getByTestId("combined-filename")).toContainText(".pdf");
  await expect(page.getByTestId("combined-page-count")).toHaveText("3 pages");

  await page.getByTestId("combine-more-button").click();
  await page.waitForURL("**/tools/combine-pdf");

  await expect(page.getByTestId("source-pdf-row")).toHaveCount(0);
  await expect(page.getByTestId("combine-button")).toBeDisabled();
});
