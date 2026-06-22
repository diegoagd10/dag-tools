/**
 * Client-side controller for the PDF Combine rich form.
 * - SortableJS drag-reorder rows
 * - Add/remove Source PDF rows
 * - Client-side file validation (extension, total size)
 * - Disable Combine button with hint below min Source PDF count
 *
 * No bundler — vanilla JS loaded via script tag. Depends on SortableJS
 * and htmx globals.
 */

(function () {
  "use strict";

  const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB
  const MIN_SOURCE_PDF_COUNT = 2;

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

  function revalidate() {
    var inputs = getFileInputs();
    var validCount = 0;
    var runningTotal = 0;
    var rejections = [];

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var row = input.closest(".source-pdf-row");
      if (!row) continue;

      // Clear previous rejection message
      var prevMsg = row.querySelector(".rejection-msg");
      if (prevMsg) prevMsg.remove();

      var file = input.files && input.files[0];
      if (!file) continue;

      var name = file.name.toLowerCase();

      // Check extension
      if (!name.endsWith(".pdf")) {
        rejections.push({ row: row, msg: "This file is not a valid PDF" });
        continue;
      }

      // Check size against running total
      if (runningTotal + file.size > MAX_TOTAL_BYTES) {
        rejections.push({ row: row, msg: "Adding this file would exceed the 50 MB total limit" });
        continue;
      }

      runningTotal += file.size;
      validCount++;
    }

    // Show rejection messages
    for (var j = 0; j < rejections.length; j++) {
      var rej = rejections[j];
      var msgEl = document.createElement("p");
      msgEl.className = "rejection-msg text-xs text-red-600 mt-1";
      msgEl.textContent = rej.msg;
      rej.row.appendChild(msgEl);
    }

    // Update running total
    var totalEl = document.getElementById("running-total");
    if (totalEl) {
      totalEl.textContent = formatBytes(runningTotal) + " / 50 MB";
    }

    // Enable/disable Combine button
    var combineBtn = document.getElementById("combine-btn");
    var canCombine = validCount >= MIN_SOURCE_PDF_COUNT;
    if (combineBtn) {
      combineBtn.disabled = !canCombine;
    }

    // Show/hide hint
    var hintEl = document.getElementById("combine-hint");
    if (hintEl) {
      hintEl.style.display = canCombine ? "none" : "block";
    }
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
