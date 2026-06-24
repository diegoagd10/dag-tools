/**
 * Client-side controller for the PDF Combine rich form.
 * - SortableJS drag-reorder rows
 * - Add/remove Source PDF rows
 * - Client-side file validation (extension, total size)
 * - Per-row server preflight via /api/v1/pdf/combine/validate to surface each
 *   Source PDF's page count next to its size readout
 * - Disable Combine button until enough selected rows are preflight-valid
 *
 * No bundler — vanilla JS loaded via script tag. Depends on SortableJS
 * and htmx globals. The client never parses PDF bytes itself; page counts
 * come exclusively from the server preflight.
 */

(function () {
  "use strict";

  const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB
  const MIN_SOURCE_PDF_COUNT = 2;
  const VALIDATE_URL = "/api/v1/pdf/combine/validate";

  // Per-row preflight cache + abort handle, keyed by the row element.
  //   { file: File, status: "pending"|"valid"|"invalid", pageCount?: number, reason?: string, abort: AbortController }
  var rowStates = new Map();

  let rowCounter = 0;
  let sortableInst = null;

  function initSortable() {
    const container = document.getElementById("source-rows");
    if (!container) return;

    // Destroy previous instance if exists
    if (sortableInst) {
      sortableInst.destroy();
      sortableInst = null;
    }

    sortableInst = new Sortable(container, {
      handle: ".sortable-grip",
      animation: 150,
      onEnd: function () {
        // DOM order changed — no hidden fields to update.
        // Merge Order = on-screen DOM order.
        revalidate();
      },
    });
  }

  function countRows() {
    const container = document.getElementById("source-rows");
    return container ? container.querySelectorAll(".source-pdf-row").length : 0;
  }

  function updateAddButton() {
    const btn = document.getElementById("add-file-btn");
    if (!btn) return;
    rowCounter = countRows();
    const nextIndex = rowCounter + 1;
    btn.setAttribute("hx-get", "/pdf/combine/row?index=" + nextIndex);
  }

  function removeRow(row) {
    abortRowPreflight(row);
    rowStates.delete(row);
    row.remove();
    updateAddButton();
    renumberLabels();
    revalidate();
    initSortable();
  }

  function renumberLabels() {
    const rows = document.querySelectorAll(".source-pdf-row");
    rows.forEach(function (row, i) {
      const label = row.querySelector("label");
      if (label) {
        label.textContent = "Source PDF " + (i + 1);
      }
    });
  }

  function getFileInputs() {
    return document.querySelectorAll("#source-rows .source-pdf-row input[type='file']");
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(1) + " MB";
    const kb = bytes / 1024;
    if (kb >= 1) return kb.toFixed(0) + " KB";
    return bytes + " B";
  }

  function clearRowRejection(row) {
    var prevMsg = row.querySelector(".rejection-msg");
    if (prevMsg) prevMsg.remove();
  }

  function showRejection(row, msg) {
    clearRowRejection(row);
    var msgEl = document.createElement("p");
    msgEl.className = "rejection-msg text-xs text-red-600 mt-1";
    msgEl.setAttribute("data-testid", "row-rejection");
    msgEl.textContent = msg;
    row.appendChild(msgEl);
  }

  function setRowSize(row, bytes, visible) {
    var sizeEl = row.querySelector(".file-size");
    if (!sizeEl) return;
    if (!visible) {
      sizeEl.classList.add("hidden");
      return;
    }
    sizeEl.textContent = formatBytes(bytes);
    sizeEl.classList.remove("hidden");
  }

  // Page count comes only from the server preflight — never fabricated.
  function setRowCount(row, pageCount) {
    var countEl = row.querySelector(".page-count");
    if (!countEl) return;
    if (pageCount === null || pageCount === undefined) {
      countEl.classList.add("hidden");
      countEl.textContent = "";
      return;
    }
    var pagesText = pageCount === 1 ? "1 page" : pageCount + " pages";
    countEl.textContent = pagesText;
    countEl.classList.remove("hidden");
  }

  function rejectionMessage(reason) {
    var messages = {
      "not-a-pdf": "This file is not a valid PDF",
      encrypted: "This file is password-protected",
      corrupt: "This file is corrupt or unreadable",
    };
    return messages[reason] || "This file could not be validated";
  }

  function abortRowPreflight(row) {
    var state = rowStates.get(row);
    if (state && state.abort) {
      state.abort.abort();
    }
  }

  // Sum the sizes of rows that passed the synchronous checks (extension + total
  // cap). Sync-rejected and empty rows are excluded; pending/valid/invalid
  // rows all showed a size, so they count toward the running total readout.
  function computeRunningTotal() {
    var rows = document.querySelectorAll("#source-rows .source-pdf-row");
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
      var st = rows[i].getAttribute("data-preflight-status");
      if (st === "pending" || st === "valid" || st === "invalid") {
        var input = rows[i].querySelector("input[type='file']");
        var file = input && input.files && input.files[0];
        if (file) total += file.size;
      }
    }
    return total;
  }

  function refreshButtonAndTotal(runningTotal) {
    var totalEl = document.getElementById("running-total");
    if (totalEl) {
      totalEl.textContent = formatBytes(runningTotal) + " / 50 MB";
    }

    var rows = document.querySelectorAll("#source-rows .source-pdf-row");
    var validCount = 0;
    var pendingCount = 0;
    var rejectedCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var st = rows[i].getAttribute("data-preflight-status") || "empty";
      if (st === "valid") validCount++;
      else if (st === "pending") pendingCount++;
      else if (st === "rejected" || st === "invalid") rejectedCount++;
    }

    // Combine is unlocked only when enough selected rows are preflight-valid
    // and none are pending or rejected.
    var combineBtn = document.getElementById("combine-btn");
    var canCombine =
      validCount >= MIN_SOURCE_PDF_COUNT &&
      pendingCount === 0 &&
      rejectedCount === 0;
    if (combineBtn) {
      combineBtn.disabled = !canCombine;
    }

    var hintEl = document.getElementById("combine-hint");
    if (hintEl) {
      hintEl.style.display = canCombine ? "none" : "block";
    }
  }

  function startPreflight(row, input, file) {
    var controller = new AbortController();
    var state = { file: file, status: "pending", abort: controller };
    rowStates.set(row, state);

    serverValidate(file, controller.signal, function (err, result) {
      // Race guard: ignore the response if the row's file changed since this
      // request was sent, or a newer preflight superseded it.
      var currentFile = input.files && input.files[0];
      if (currentFile !== file) return;
      var latest = rowStates.get(row);
      if (!latest || latest.file !== file) return;

      if (err || !result || !result.valid) {
        state.status = "invalid";
        state.reason = (result && result.reason) || "corrupt";
        setRowCount(row, null);
        showRejection(row, rejectionMessage(state.reason));
        row.setAttribute("data-preflight-status", "invalid");
      } else {
        state.status = "valid";
        state.pageCount = result.pageCount;
        clearRowRejection(row);
        setRowCount(row, result.pageCount);
        row.setAttribute("data-preflight-status", "valid");
      }
      refreshButtonAndTotal(computeRunningTotal());
    });
  }

  function serverValidate(file, signal, callback) {
    var fd = new FormData();
    fd.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", VALIDATE_URL);

    if (signal) {
      signal.addEventListener("abort", function () {
        xhr.abort();
      });
      if (signal.aborted) return;
    }

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          callback(null, JSON.parse(xhr.responseText));
        } catch {
          callback(new Error("Invalid JSON response"));
        }
      } else {
        callback(new Error("Validation failed with status " + xhr.status));
      }
    };
    xhr.onerror = function () {
      // Aborted requests are intentional — ignore them.
      if (xhr.status === 0) return;
      callback(new Error("Network error during validation"));
    };
    xhr.send(fd);
  }

  function revalidate() {
    var inputs = getFileInputs();
    var runningTotal = 0;

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var row = input.closest(".source-pdf-row");
      if (!row) continue;

      var file = input.files && input.files[0];

      // No file selected: clear the row completely.
      if (!file) {
        clearRowRejection(row);
        setRowSize(row, 0, false);
        setRowCount(row, null);
        abortRowPreflight(row);
        rowStates.delete(row);
        row.setAttribute("data-preflight-status", "empty");
        continue;
      }

      var name = file.name.toLowerCase();

      // Extension gate (synchronous).
      if (!name.endsWith(".pdf")) {
        clearRowRejection(row);
        setRowSize(row, 0, false);
        setRowCount(row, null);
        showRejection(row, "This file is not a valid PDF");
        abortRowPreflight(row);
        rowStates.delete(row);
        row.setAttribute("data-preflight-status", "rejected");
        continue;
      }

      // Total-size gate (synchronous, order-dependent — preserved behavior).
      if (runningTotal + file.size > MAX_TOTAL_BYTES) {
        clearRowRejection(row);
        setRowSize(row, 0, false);
        setRowCount(row, null);
        showRejection(row, "Adding this file would exceed the 50 MB total limit");
        abortRowPreflight(row);
        rowStates.delete(row);
        row.setAttribute("data-preflight-status", "rejected");
        continue;
      }

      runningTotal += file.size;
      // Size is known client-side — show it immediately.
      setRowSize(row, file.size, true);

      // Reuse a cached preflight result when the file hasn't changed (e.g.
      // after a drag reorder or adding/removing another row) so we don't
      // refire the server round-trip or flicker the button.
      var state = rowStates.get(row);
      if (state && state.file === file) {
        clearRowRejection(row);
        if (state.status === "valid") {
          setRowCount(row, state.pageCount);
          row.setAttribute("data-preflight-status", "valid");
        } else if (state.status === "invalid") {
          setRowCount(row, null);
          showRejection(row, rejectionMessage(state.reason));
          row.setAttribute("data-preflight-status", "invalid");
        } else {
          // Still pending — keep page count hidden; the in-flight preflight
          // will resolve and refresh the button.
          setRowCount(row, null);
          row.setAttribute("data-preflight-status", "pending");
        }
      } else {
        // New file (or first selection) — kick off the server preflight.
        clearRowRejection(row);
        setRowCount(row, null);
        abortRowPreflight(row);
        row.setAttribute("data-preflight-status", "pending");
        startPreflight(row, input, file);
      }
    }

    refreshButtonAndTotal(runningTotal);
  }

  // Event delegation for the whole form
  document.addEventListener("click", function (e) {
    // Remove button
    if (e.target.closest(".remove-row")) {
      var row = e.target.closest(".source-pdf-row");
      if (row) removeRow(row);
      return;
    }
  });

  // Listen for file input changes
  document.addEventListener("change", function (e) {
    var target = e.target;
    if (target && target.type === "file" && target.closest("#source-rows")) {
      revalidate();
    }
  });

  // After htmx adds a row, reinitialize SortableJS and update counters
  document.addEventListener("htmx:afterSettle", function (e) {
    var target = e.target;
    // Check if the settled element is a source-pdf-row or contains one
    if (target && target.closest && target.closest("#source-rows")) {
      initSortable();
      updateAddButton();
      revalidate();
    }
    // Also check if the settled element is inside source-rows
    if (target && target.querySelector && target.querySelector(".source-pdf-row")) {
      initSortable();
      updateAddButton();
      revalidate();
    }
  });

  // Also handle hx-swap inner settle for the container itself
  document.addEventListener("htmx:afterSwap", function (e) {
    var target = e.target;
    if (target && (target.id === "source-rows" || target.closest("#source-rows"))) {
      // Small delay to let DOM settle
      setTimeout(function () {
        initSortable();
        updateAddButton();
        revalidate();
      }, 0);
    }
  });

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", function () {
    initSortable();
    updateAddButton();
    revalidate();
  });
})();
