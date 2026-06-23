/**
 * Client-side controller for the QR Code Tool form.
 * - Disables submit while trimmed QR Content is empty
 * - Blocks input beyond 2048 UTF-8 bytes
 * - Shows inline hint explaining gating state
 *
 * No bundler — vanilla JS loaded via script tag. Depends on htmx global.
 */
(function () {
  "use strict";

  var MAX_BYTES = 2048;

  var textarea = document.getElementById("qr-content");
  var submitBtn = document.getElementById("qr-submit");
  var hintEl = document.getElementById("qr-hint");

  var encoder = new TextEncoder();

  function trimmedValue() {
    return textarea ? textarea.value.trim() : "";
  }

  function byteLength(str) {
    return encoder.encode(str).length;
  }

  /**
   * Truncate string to at most maxBytes UTF-8 bytes without splitting
   * multi-byte characters. Iterates codepoints until the accumulator
   * would exceed the limit, then stops.
   */
  function truncateToByteLimit(str, maxBytes) {
    var acc = 0;
    var i = 0;
    while (i < str.length) {
      var char = str[i];
      var code = char.codePointAt(0);
      var charBytes = 1;
      if (code > 0x7f) charBytes = code > 0x7ff ? (code > 0xffff ? 4 : 3) : 2;
      if (acc + charBytes > maxBytes) break;
      acc += charBytes;
      // Advance by surrogate-pair width if needed
      i += code >= 0x10000 ? 2 : 1;
    }
    return str.slice(0, i);
  }

  function setHint(text) {
    if (hintEl) {
      hintEl.textContent = text;
    }
  }

  function revalidate() {
    if (!submitBtn) return;

    var trimmed = trimmedValue();

    if (trimmed.length === 0) {
      submitBtn.disabled = true;
      setHint("QR Content is required to generate.");
      return;
    }

    if (byteLength(trimmed) > MAX_BYTES) {
      submitBtn.disabled = true;
      setHint("Content exceeds the maximum length of 2048 bytes.");
      return;
    }

    submitBtn.disabled = false;
    setHint("Ready — click Generate QR Code to create a shareable image.");
  }

  function onInput(e) {
    var el = e.target;
    var raw = el.value;

    // Truncate raw input to byte limit (safe, no multi-byte split)
    var truncated = truncateToByteLimit(raw, MAX_BYTES);
    if (truncated !== raw) {
      el.value = truncated;
    }

    revalidate();
  }

  // Initialize on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function () {
    if (!textarea || !submitBtn || !hintEl) return;

    // Disable submit on init (JS users only; HTML button stays enabled for
    // no-JS users so the server remains authoritative)
    submitBtn.disabled = true;
    setHint("QR Content is required to generate.");

    // Listen for input changes
    textarea.addEventListener("input", onInput);
  });
})();
