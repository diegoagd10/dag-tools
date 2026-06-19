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
