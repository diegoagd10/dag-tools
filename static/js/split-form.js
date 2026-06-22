/**
 * Client-side controller for the PDF Split form.
 * - Reject non-.pdf files before upload
 * - Reject files over the 50 MB Split limit before upload
 * - Gate Split button
 *
 * No bundler — vanilla JS loaded via script tag. Depends on htmx global.
 */
(function () {
  "use strict";

  var MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    var mb = bytes / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(1) + " MB";
    var kb = bytes / 1024;
    if (kb >= 1) return kb.toFixed(0) + " KB";
    return bytes + " B";
  }

  function revalidate() {
    var input = document.getElementById("split-file-input");
    var rejectionEl = document.getElementById("split-file-rejection");
    var splitBtn = document.getElementById("split-btn");
    var hintEl = document.getElementById("split-hint");

    if (!input || !splitBtn) return;

    // Clear previous rejection
    if (rejectionEl) {
      rejectionEl.textContent = "";
      rejectionEl.classList.add("hidden");
    }

    var file = input.files && input.files[0];

    if (!file) {
      splitBtn.disabled = true;
      if (hintEl) hintEl.style.display = "block";
      return;
    }

    var name = file.name.toLowerCase();

    // Check extension
    if (!name.endsWith(".pdf")) {
      if (rejectionEl) {
        rejectionEl.textContent = "This file is not a valid PDF";
        rejectionEl.classList.remove("hidden");
      }
      splitBtn.disabled = true;
      if (hintEl) hintEl.style.display = "none";
      return;
    }

    // Check size
    if (file.size > MAX_FILE_BYTES) {
      if (rejectionEl) {
        rejectionEl.textContent =
          "This file is over the 50 MB limit (" +
          formatBytes(file.size) +
          ")";
        rejectionEl.classList.remove("hidden");
      }
      splitBtn.disabled = true;
      if (hintEl) hintEl.style.display = "none";
      return;
    }

    // Valid
    splitBtn.disabled = false;
    if (hintEl) hintEl.style.display = "none";
  }

  // Listen for file input changes
  document.addEventListener("change", function (e) {
    var target = e.target;
    if (target && target.id === "split-file-input") {
      revalidate();
    }
  });

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", function () {
    revalidate();
  });
})();
