import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const fixtures = (name: string) =>
  resolve(process.cwd(), "tests", "fixtures", name);

test("home → upload a PDF → split → result → download a valid ZIP with one page-NNN.pdf per page", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("tool-card-split-pdf")).toBeVisible();
  await page.getByTestId("open-split-pdf").click();
  await page.waitForURL("**/tools/split-pdf");

  await expect(page.getByTestId("split-button")).toBeDisabled();

  await page
    .getByTestId("split-pdf-file-input")
    .setInputFiles(fixtures("sample-multi-page.pdf"));

  await expect(page.getByTestId("source-filename")).toHaveText(
    "sample-multi-page.pdf",
  );
  await expect(page.getByTestId("source-page-count")).toHaveText("3 pages");
  await expect(page.getByTestId("source-size")).toBeVisible();

  await expect(page.getByTestId("split-button")).toBeEnabled();
  await page.getByTestId("split-button").click();

  await page.waitForURL("**/tools/split-pdf/result");

  await expect(page.getByTestId("split-filename")).toContainText("split-");
  await expect(page.getByTestId("split-filename")).toContainText(".zip");
  await expect(page.getByTestId("split-page-count")).toHaveText("3 pages");
  await expect(page.getByTestId("split-again-button")).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("download-button").click(),
  ]).then(([d]) => d);

  const destination = resolve(tmpdir(), `split-${Date.now()}.zip`);
  await download.saveAs(destination);
  const bytes = await readFile(destination);

  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).sort();
  expect(names).toEqual(["page-001.pdf", "page-002.pdf", "page-003.pdf"]);

  for (const name of names) {
    const entry = await zip.file(name)!.async("uint8array");
    const doc = await PDFDocument.load(entry);
    expect(doc.getPageCount()).toBe(1);
  }
});

test("Split again resets the store and returns to an empty tool page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("open-split-pdf").click();
  await page.waitForURL("**/tools/split-pdf");

  await page
    .getByTestId("split-pdf-file-input")
    .setInputFiles(fixtures("sample-multi-page.pdf"));

  await page.getByTestId("split-button").click();
  await page.waitForURL("**/tools/split-pdf/result");

  await expect(page.getByTestId("split-filename")).toContainText(".zip");

  await page.getByTestId("split-again-button").click();
  await page.waitForURL("**/tools/split-pdf");

  await expect(page.getByTestId("source-pdf-info")).toHaveCount(0);
  await expect(page.getByTestId("split-button")).toBeDisabled();
});
