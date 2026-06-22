/**
 * Client-side controller for the PDF Split form.
 * - Reject non-.pdf files, oversized files, non-PDF magic bytes before upload
 * - Call server validation endpoint for page-count gate
 * - Gate Split button until validated
 *
 * No bundler — vanilla JS loaded via script tag. Depends on htmx global.
 */
(function () {
  "use strict";

  var MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
  var validationAbort = null; // AbortController for in-flight validation request

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
      splitBtn.textContent = "Split";
      if (hintEl) hintEl.style.display = "block";
      return;
    }

    var name = file.name.toLowerCase();

    // Check extension
    if (!name.endsWith(".pdf")) {
      showRejection(rejectionEl, "This file is not a valid PDF");
      splitBtn.disabled = true;
      splitBtn.textContent = "Split";
      if (hintEl) hintEl.style.display = "none";
      return;
    }

    // Check size
    if (file.size > MAX_FILE_BYTES) {
      showRejection(
        rejectionEl,
        "This file is over the 50 MB limit (" +
          formatBytes(file.size) +
          ")",
      );
      splitBtn.disabled = true;
      splitBtn.textContent = "Split";
      if (hintEl) hintEl.style.display = "none";
      return;
    }

    // Validate PDF magic bytes (%PDF-)
    validateMagicBytes(file, function (isValid) {
      if (!isValid) {
        showRejection(rejectionEl, "This file is not a valid PDF");
        splitBtn.disabled = true;
        splitBtn.textContent = "Split";
        if (hintEl) hintEl.style.display = "none";
        return;
      }

      // Quick checks passed — now do server-side page-count validation
      splitBtn.disabled = true;
      splitBtn.textContent = "Validating…";
      if (hintEl) hintEl.style.display = "none";

      // Abort any in-flight validation for a previous file
      if (validationAbort) {
        validationAbort.abort();
      }
      validationAbort = new AbortController();

      var validationToken = file;
      serverValidate(file, validationAbort.signal, function (err, result) {
        // Guard: ignore stale responses if the file changed since request was sent
        var currentFile = input.files && input.files[0];
        if (currentFile !== validationToken) {
          return;
        }

        if (err || !result || !result.valid) {
          var reason = (result && result.reason) || "corrupt";
          var messages = {
            "not-a-pdf": "This file is not a valid PDF",
            encrypted: "This file is password-protected",
            corrupt: "This file is corrupt or unreadable",
            "too-few-pages": "This PDF contains no pages to split",
            oversize: "This file is over the 50 MB limit",
          };
          showRejection(
            rejectionEl,
            messages[reason] || "This file could not be validated",
          );
          splitBtn.disabled = true;
          splitBtn.textContent = "Split";
          return;
        }

        // Valid — page count known
        if (rejectionEl) {
          rejectionEl.textContent = "";
          rejectionEl.classList.add("hidden");
        }
        var pagesText =
          result.pageCount === 1 ? "1 page" : result.pageCount + " pages";
        splitBtn.disabled = false;
        splitBtn.textContent = "Split (" + pagesText + ")";
      });
    });
  }

  function showRejection(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  function validateMagicBytes(file, callback) {
    // Read first 5 bytes — PDF header is "%PDF-"
    var reader = new FileReader();
    reader.onload = function () {
      var arr = new Uint8Array(reader.result);
      if (arr.length < 5) {
        callback(false);
        return;
      }
      // Check %PDF-
      callback(
        arr[0] === 0x25 &&
          arr[1] === 0x50 &&
          arr[2] === 0x44 &&
          arr[3] === 0x46 &&
          arr[4] === 0x2d,
      );
    };
    reader.onerror = function () {
      callback(false);
    };
    reader.readAsArrayBuffer(file.slice(0, 5));
  }

  function serverValidate(file, signal, callback) {
    var fd = new FormData();
    fd.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/pdf/split/validate");

    // Wire abort signal: abort XHR when a new validation starts
    if (signal) {
      signal.addEventListener("abort", function () {
        xhr.abort();
      });
      // If already aborted (race), don't send
      if (signal.aborted) return;
    }

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          callback(null, data);
        } catch {
          callback(new Error("Invalid JSON response"));
        }
      } else {
        callback(new Error("Validation failed with status " + xhr.status));
      }
    };
    xhr.onerror = function () {
      // Ignore aborted requests — they are intentional
      if (xhr.status === 0) return;
      callback(new Error("Network error during validation"));
    };
    xhr.send(fd);
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
