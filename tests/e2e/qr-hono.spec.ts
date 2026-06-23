import { test, expect } from "@playwright/test";

test.describe("QR Code Tool client gating", () => {
  test("submit disabled on load with empty hint", async ({ page }) => {
    await page.goto("/links/qr");

    await expect(page.getByTestId("qr-form")).toBeVisible();

    // Submit should be disabled initially
    const submitBtn = page.getByTestId("qr-submit-button");
    await expect(submitBtn).toBeDisabled();

    // Hint should say empty/content required
    const hint = page.getByTestId("qr-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText("QR Content is required to generate.");
  });

  test("submit enabled and ready hint after filling valid content", async ({
    page,
  }) => {
    await page.goto("/links/qr");

    const textarea = page.getByTestId("qr-content-input");
    const submitBtn = page.getByTestId("qr-submit-button");
    const hint = page.getByTestId("qr-hint");

    // Initially disabled
    await expect(submitBtn).toBeDisabled();

    // Fill valid content
    await textarea.fill("https://example.com");

    // Submit should now be enabled
    await expect(submitBtn).toBeEnabled();

    // Hint should show ready
    await expect(hint).toHaveText(
      "Ready — click Generate QR Code to create a shareable image.",
    );
  });

  test("submit disabled after clearing input back to empty", async ({ page }) => {
    await page.goto("/links/qr");

    const textarea = page.getByTestId("qr-content-input");
    const submitBtn = page.getByTestId("qr-submit-button");

    // Fill then clear
    await textarea.fill("https://example.com");
    await expect(submitBtn).toBeEnabled();

    await textarea.fill("  ");
    await expect(submitBtn).toBeDisabled();
  });

  test("whitespace-only input treated as empty", async ({ page }) => {
    await page.goto("/links/qr");

    const textarea = page.getByTestId("qr-content-input");
    const submitBtn = page.getByTestId("qr-submit-button");

    await textarea.fill("   \n  \t  ");
    await expect(submitBtn).toBeDisabled();
  });

  test("input truncated at 2048 bytes, stays within limit", async ({ page }) => {
    await page.goto("/links/qr");

    const textarea = page.getByTestId("qr-content-input");
    const submitBtn = page.getByTestId("qr-submit-button");
    const hint = page.getByTestId("qr-hint");

    // Exactly at limit: 2048 bytes, should be enabled
    const atLimit = "a".repeat(2048);
    await textarea.fill(atLimit);
    await expect(submitBtn).toBeEnabled();
    await expect(hint).toContainText("Ready");

    // Add one more byte — should be truncated back to 2048
    await textarea.fill(atLimit + "b");
    const afterOneMore = await textarea.inputValue();
    expect(new TextEncoder().encode(afterOneMore).length).toBe(2048);
    await expect(submitBtn).toBeEnabled();

    // Paste 3000 bytes — should be truncated
    const overLimit = "x".repeat(3000);
    await textarea.fill(overLimit);
    const truncated = await textarea.inputValue();
    expect(new TextEncoder().encode(truncated).length).toBeLessThanOrEqual(2048);
    await expect(submitBtn).toBeEnabled();
  });

  test("multi-byte character truncation does not split characters", async ({
    page,
  }) => {
    await page.goto("/links/qr");

    const textarea = page.getByTestId("qr-content-input");

    // "á" is 2 bytes in UTF-8. 1024 of them = 2048 bytes (exactly at limit).
    // Adding one more = 2050 bytes; truncation should stop at 1024 chars
    // (2048 bytes), not cutting in the middle of a multi-byte char.
    const excess = "á".repeat(1025); // 2050 bytes
    await textarea.fill(excess);

    const value = await textarea.inputValue();
    const bytes = new TextEncoder().encode(value).length;

    // Must not exceed 2048 bytes
    expect(bytes).toBeLessThanOrEqual(2048);

    // Must be exactly 1024 chars (2048 bytes) — no partial multi-byte char
    expect(value.length).toBe(1024);
    expect(bytes).toBe(2048);

    // Verify all characters are intact (each "á" is the correct char, not garbled)
    for (const ch of value) {
      expect(ch).toBe("á");
    }
  });
});

test.describe("QR Code Tool smoke flow", () => {
  test("fill form, submit, Share Link appears, Creating… indicator, open Share Link, image renders", async ({
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

    // Verify the indicator text shows "Creating…"
    const indicator = page.locator("#qr-indicator");
    await expect(indicator).toHaveText("Creating…");

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
});
