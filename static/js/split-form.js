/**
 * Client-side controller for the PDF Split form.
 *
 * Single-selection: one Source PDF via drag-and-drop or click-to-browse.
 * - Drop zone visual feedback on dragover/dragleave
 * - Extension / size / magic-byte gates before server validation
 * - Server preflight via POST /api/v1/pdf/split/validate (page count)
 * - Selected-file card rendered client-side (filename, size, page count)
 * - Replace on re-drop / re-pick; remove control clears and returns to empty zone
 * - "Split PDF" CTA gated until preflight-valid Source PDF selected
 * - Submission stays native htmx form POST reading `name="file"`
 *
 * No bundler — vanilla JS loaded via script tag. Depends on htmx global.
 */
(function () {
  "use strict";

  var MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
  var VALIDATE_URL = "/api/v1/pdf/split/validate";
  var validationAbort = null;

  // -------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------
  var selectedFile = null;
  // { file: File, pageCount: number, size: number, name: string, status: "pending" | "valid" | "invalid", reason: string | null }

  // -------------------------------------------------------------------
  // DOM refs (cached on init)
  // -------------------------------------------------------------------
  var inputEl, dropZone, cardSlot, rejectionEl, splitBtn, splitHint;
  var splitBtnOriginalText = "Split PDF";

  function cacheDOMElements() {
    inputEl = document.getElementById("split-file-input");
    dropZone = document.getElementById("drop-zone");
    cardSlot = document.getElementById("selected-file-card");
    rejectionEl = document.getElementById("split-file-rejection");
    splitBtn = document.getElementById("split-btn");
    splitHint = document.getElementById("split-hint");
  }

  // -------------------------------------------------------------------
  // Formatting
  // -------------------------------------------------------------------
  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    var mb = bytes / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(1) + " MB";
    var kb = bytes / 1024;
    if (kb >= 1) return kb.toFixed(0) + " KB";
    return bytes + " B";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // -------------------------------------------------------------------
  // Rejection display
  // -------------------------------------------------------------------
  function showRejection(message) {
    if (!rejectionEl) return;
    rejectionEl.textContent = message;
    rejectionEl.classList.remove("hidden");
  }

  function clearRejection() {
    if (!rejectionEl) return;
    rejectionEl.textContent = "";
    rejectionEl.classList.add("hidden");
  }

  // -------------------------------------------------------------------
  // Card rendering
  // -------------------------------------------------------------------
  function renderCard() {
    if (!cardSlot) return;

    if (!selectedFile || selectedFile.status === "invalid") {
      cardSlot.innerHTML = "";
      hideCard();
      return;
    }

    var statusText = "";
    if (selectedFile.status === "pending") {
      statusText = '<span class="text-xs text-muted">Validating…</span>';
    } else if (selectedFile.status === "valid") {
      var pagesText =
        selectedFile.pageCount === 1
          ? "1 page"
          : selectedFile.pageCount + " pages";
      statusText =
        '<span class="text-xs text-muted tabular-nums">' +
        pagesText +
        " • " +
        formatBytes(selectedFile.size) +
        "</span>";
    }

    cardSlot.innerHTML =
      '<div class="mt-3 rounded-lg border border-hairline bg-paper px-4 py-3 flex items-center gap-3" data-testid="split-selected-card">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-accent" aria-hidden="true">' +
      '<path d="M14 11V3H6" />' +
      '<path d="M14 3L8 9L5 6L2 9" />' +
      "</svg>" +
      '<div class="flex-1 min-w-0 flex flex-col gap-0.5">' +
      '<span class="truncate font-sans text-sm font-medium text-ink" data-testid="split-card-name">' +
      escapeHtml(selectedFile.name) +
      "</span>" +
      statusText +
      "</div>" +
      '<button type="button" class="shrink-0 rounded p-1 text-muted transition-colors hover:text-red-500 hover:bg-red-100" data-testid="split-remove-button" aria-label="Remove ' +
      escapeHtml(selectedFile.name) +
      '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="h-4 w-4">' +
      '<line x1="4" y1="4" x2="12" y2="12" />' +
      '<line x1="12" y1="4" x2="4" y2="12" />' +
      "</svg>" +
      "</button>" +
      "</div>";

    showCard();
  }

  function showCard() {
    if (cardSlot) cardSlot.style.display = "";
  }

  function hideCard() {
    if (cardSlot) cardSlot.style.display = "none";
  }

  // -------------------------------------------------------------------
  // CTA gating
  // -------------------------------------------------------------------
  function refreshSubmitGate() {
    if (!splitBtn) return;

    if (!selectedFile || selectedFile.status !== "valid") {
      splitBtn.disabled = true;
      splitBtn.textContent = splitBtnOriginalText;
      if (splitHint) splitHint.style.display = "block";
      return;
    }

    var pagesText =
      selectedFile.pageCount === 1
        ? "1 page"
        : selectedFile.pageCount + " pages";
    splitBtn.disabled = false;
    splitBtn.textContent = "Split PDF (" + pagesText + ")";
    if (splitHint) splitHint.style.display = "none";
  }

  // -------------------------------------------------------------------
  // Clear selection — back to empty zone
  // -------------------------------------------------------------------
  function clearSelection() {
    // Abort in-flight validation
    if (validationAbort) {
      validationAbort.abort();
      validationAbort = null;
    }

    selectedFile = null;

    // Clear hidden file input via empty DataTransfer
    if (inputEl) {
      var dt = new DataTransfer();
      inputEl.files = dt.files;
      inputEl.value = "";
    }

    hideCard();
    if (cardSlot) cardSlot.innerHTML = "";
    clearRejection();
    refreshSubmitGate();
  }

  // -------------------------------------------------------------------
  // Server preflight via /validate
  // -------------------------------------------------------------------
  function serverValidate(file, validationToken) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", VALIDATE_URL);

    var fd = new FormData();
    fd.append("file", file);

    if (validationAbort) {
      validationAbort.abort();
    }
    validationAbort = new AbortController();

    validationAbort.signal.addEventListener("abort", function () {
      xhr.abort();
    });

    xhr.onload = function () {
      // Stale response guard
      if (!selectedFile || selectedFile.file !== validationToken) return;

      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.valid && data.pageCount >= 1) {
            selectedFile.status = "valid";
            selectedFile.pageCount = data.pageCount;
            selectedFile.size = data.size;
            selectedFile.reason = null;
          } else {
            var reason = (data && data.reason) || "corrupt";
            selectedFile.status = "invalid";
            selectedFile.reason = reason;
            showRejection(rejectionMessage(reason));
          }
        } catch (_e) {
          selectedFile.status = "invalid";
          selectedFile.reason = "corrupt";
          showRejection(rejectionMessage("corrupt"));
        }
      } else {
        selectedFile.status = "invalid";
        selectedFile.reason = "corrupt";
        showRejection(rejectionMessage("corrupt"));
      }

      renderCard();
      refreshSubmitGate();
    };

    xhr.onerror = function () {
      if (xhr.status === 0) return; // aborted intentionally
      if (!selectedFile || selectedFile.file !== validationToken) return;
      selectedFile.status = "invalid";
      selectedFile.reason = "corrupt";
      showRejection(rejectionMessage("corrupt"));
      renderCard();
      refreshSubmitGate();
    };

    xhr.send(fd);
  }

  function rejectionMessage(reason) {
    var messages = {
      "not-a-pdf": "This file is not a valid PDF",
      encrypted: "This file is password-protected",
      corrupt: "This file is corrupt or unreadable",
      "too-few-pages": "This PDF contains no pages to split",
      oversize: "This file is over the 50 MB limit",
    };
    return messages[reason] || "This file could not be validated";
  }

  // -------------------------------------------------------------------
  // Handle file selection (called by drop and browse)
  // -------------------------------------------------------------------
  function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    // Abort any in-flight validation
    if (validationAbort) {
      validationAbort.abort();
      validationAbort = null;
    }

    clearRejection();

    var file = fileList[0];
    var name = file.name.toLowerCase();

    // Extension gate
    if (!name.endsWith(".pdf")) {
      selectedFile = null;
      clearFileInput();
      hideCard();
      if (cardSlot) cardSlot.innerHTML = "";
      showRejection("This file is not a valid PDF");
      refreshSubmitGate();
      return;
    }

    // Size gate
    if (file.size > MAX_FILE_BYTES) {
      selectedFile = null;
      clearFileInput();
      hideCard();
      if (cardSlot) cardSlot.innerHTML = "";
      showRejection(
        "This file is over the 50 MB limit (" + formatBytes(file.size) + ")"
      );
      refreshSubmitGate();
      return;
    }

    // Magic bytes gate (%PDF-)
    validateMagicBytes(file, function (isValid) {
      if (!isValid) {
        selectedFile = null;
        clearFileInput();
        hideCard();
        if (cardSlot) cardSlot.innerHTML = "";
        showRejection("This file is not a valid PDF");
        refreshSubmitGate();
        return;
      }

      // All quick checks passed — set state and populate hidden input
      selectedFile = {
        file: file,
        pageCount: 0,
        size: file.size,
        name: file.name,
        status: "pending",
        reason: null,
      };

      // Populate hidden file input via DataTransfer (one-item list)
      var dt = new DataTransfer();
      dt.items.add(file);
      inputEl.files = dt.files;

      clearRejection();
      renderCard();
      refreshSubmitGate();

      // Fire server validation
      serverValidate(file, file);
    });
  }

  function clearFileInput() {
    if (!inputEl) return;
    var dt = new DataTransfer();
    inputEl.files = dt.files;
    inputEl.value = "";
  }

  function validateMagicBytes(file, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      var arr = new Uint8Array(reader.result);
      if (arr.length < 5) {
        callback(false);
        return;
      }
      callback(
        arr[0] === 0x25 &&
          arr[1] === 0x50 &&
          arr[2] === 0x44 &&
          arr[3] === 0x46 &&
          arr[4] === 0x2d
      );
    };
    reader.onerror = function () {
      callback(false);
    };
    reader.readAsArrayBuffer(file.slice(0, 5));
  }

  // -------------------------------------------------------------------
  // Event wiring
  // -------------------------------------------------------------------
  function init() {
    cacheDOMElements();
    if (!inputEl || !dropZone) return;

    // Hidden file input — browse (click on drop zone passes through to this)
    inputEl.addEventListener("change", function () {
      if (inputEl.files && inputEl.files.length > 0) {
        handleFiles(inputEl.files);
        // Reset value for re-selection edge case (same file picked again)
        inputEl.value = "";
      }
    });

    // Drop zone — keyboard activation
    dropZone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputEl.click();
      }
    });

    // Drop zone — drag visual feedback
    dropZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("border-accent", "bg-accent/5");
    });

    dropZone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("border-accent", "bg-accent/5");
    });

    // Drop zone — drop handler
    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("border-accent", "bg-accent/5");

      if (!e.dataTransfer || !e.dataTransfer.files) return;
      if (e.dataTransfer.files.length === 0) return;

      // Reset browse input for re-selection edge case
      inputEl.value = "";

      handleFiles(e.dataTransfer.files);
    });

    // Card slot — remove button (event delegation)
    if (cardSlot) {
      cardSlot.addEventListener("click", function (e) {
        var removeBtn = e.target.closest("[data-testid='split-remove-button']");
        if (!removeBtn) return;
        clearSelection();
      });
    }

    // Initial gate state
    refreshSubmitGate();
    hideCard();

    // Expose for e2e testing
    window.__splitSelection = {
      getState: function () {
        if (!selectedFile) return null;
        return {
          name: selectedFile.name,
          size: selectedFile.size,
          pageCount: selectedFile.pageCount,
          status: selectedFile.status,
          reason: selectedFile.reason,
        };
      },
      clear: clearSelection,
    };
  }

  // -------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
