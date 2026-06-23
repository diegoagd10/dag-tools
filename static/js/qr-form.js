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
   * multi-byte or surrogate-pair characters. Uses Array.from() to
   * iterate code points, then TextEncoder to count bytes per point.
   */
  function truncateToByteLimit(str, maxBytes) {
    var points = Array.from(str);
    var acc = 0;
    for (var i = 0; i < points.length; i++) {
      var bytes = encoder.encode(points[i]).length;
      if (acc + bytes > maxBytes) {
        return points.slice(0, i).join("");
      }
      acc += bytes;
    }
    return str;
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

    // Check over-limit BEFORE truncating so the too-long hint surfaces.
    // Server applies the byte limit to trimmed content; we match that here.
    var rawLen = byteLength(raw);
    if (rawLen > MAX_BYTES) {
      el.value = truncateToByteLimit(raw, MAX_BYTES);

      // If truncated content is non-empty-after-trim, enable submit.
      // The too-long hint persists until the next keystroke that stays
      // within limit (at which point revalidate() shows "Ready").
      var trimmed = trimmedValue();
      submitBtn.disabled = trimmed.length === 0;
      setHint("Content exceeds the maximum length of 2048 bytes.");
      return;
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
