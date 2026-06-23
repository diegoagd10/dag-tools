import { test, expect } from "@playwright/test";

test("Hono QR Code — fill form, submit, Share Link appears, open Share Link, image renders", async ({
  page,
}) => {
  await page.goto("/links/qr");

  // Should have the QR form
  await expect(page.getByTestId("qr-form")).toBeVisible();

  // Fill in QR Content
  const textarea = page.getByTestId("qr-content-input");
  await textarea.fill("https://example.com");

  // Submit the form
  await page.getByTestId("qr-submit-button").click();

  // Wait for the result (Share Link panel)
  await expect(page.locator("#qr-result")).toBeVisible({ timeout: 10000 });

  // Should contain a share link in the text input
  const urlInput = page.locator("#qr-result input[type='text']");
  await expect(urlInput).toBeVisible();
  const inputValue = await urlInput.inputValue();
  expect(inputValue).toMatch(/^\/links\/qr\/[A-Za-z0-9_-]+$/);

  // Should show an "Open" link
  const link = page.locator("#qr-result a:has-text('Open')");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/links\/qr\/[A-Za-z0-9_-]+$/);

  // Extract the share URL and open the Share Link
  const shareUrl = inputValue;

  // Navigate to the share link
  await page.goto(shareUrl);

  // Should show a QR Code image
  const img = page.locator("img[alt='QR Code']");
  await expect(img).toBeVisible({ timeout: 10000 });

  // The image src should end with .png
  const imgSrc = await img.getAttribute("src");
  expect(imgSrc).toMatch(/\.png$/);

  // Should have a "Create another" link
  await expect(page.getByText("Create another")).toBeVisible();
});
