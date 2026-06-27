/**
 * Client-side controller for the PDF Combine selection screen.
 *
 * Owns a Selection module (per ADR-0006) that manages an ordered set of
 * Source PDFs, a hidden multiple-file input, and the Merge Order.
 * Cards are client-rendered; preflight runs via POST /api/v1/pdf/combine/validate.
 * SortableJS drives drag-reorder. Submission remains a native htmx form POST.
 *
 * No bundler — vanilla JS loaded via script tag. Depends on SortableJS
 * and htmx globals.
 */
(function () {
  "use strict";


  var MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB
  var MIN_SOURCE_PDF_COUNT = 2;
  var VALIDATE_URL = "/api/v1/pdf/combine/validate";

  // ---------------------------------------------------------------------
  // Selection module — per ADR-0006 contract
  // ---------------------------------------------------------------------
  function createSelection(inputEl) {
    var items = []; // { id, name, size, file, status, reason? }
    var nextId = 0;
    var listeners = [];

    function dupKey(file) {
      return file.name + "|" + file.size + "|" + file.lastModified;
    }

    function rebuildFiles() {
      var dt = new DataTransfer();
      for (var i = 0; i < items.length; i++) {
        if (items[i].file) {
          dt.items.add(items[i].file);
        }
      }
      inputEl.files = dt.files;
    }

    function notify() {
      for (var i = 0; i < listeners.length; i++) {
        listeners[i]();
      }
    }

    /**
     * @param {FileList|File[]} fileList
     * @returns {{ added: Array, rejected: Array }}
     */
    function add(fileList) {
      var added = [];
      var rejected = [];
      var existingKeys = {};

      for (var i = 0; i < items.length; i++) {
        if (items[i].file) {
          existingKeys[dupKey(items[i].file)] = true;
        }
      }

      var runningTotal = items.reduce(function (sum, it) {
        return sum + (it.file ? it.file.size : 0);
      }, 0);

      for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i];

        // Extension gate
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          rejected.push({ name: file.name, reason: "not-a-pdf" });
          continue;
        }

        // Duplicate gate (name + size + lastModified)
        var key = dupKey(file);
        if (existingKeys[key]) {
          // Silently skip duplicates — no user-visible message per spec
          continue;
        }
        existingKeys[key] = true;

        // Total size gate (order-dependent 50 MB cap)
        if (runningTotal + file.size > MAX_TOTAL_BYTES) {
          rejected.push({ name: file.name, reason: "over-limit" });
          continue;
        }
        runningTotal += file.size;

        var id = "pdf-" + (++nextId);
        items.push({
          id: id,
          name: file.name,
          size: file.size,
          file: file,
          status: "pending",
          reason: null,
        });
        added.push({ id: id, name: file.name, size: file.size });
      }

      if (added.length > 0 || rejected.length > 0) {
        rebuildFiles();
        notify();
      }

      return { added: added, rejected: rejected };
    }

    function remove(id) {
      var idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return;
      items.splice(idx, 1);
      rebuildFiles();
      notify();
    }

    function reorder(idsInOrder) {
      var map = {};
      for (var i = 0; i < items.length; i++) {
        map[items[i].id] = items[i];
      }
      var reordered = [];
      for (var i = 0; i < idsInOrder.length; i++) {
        var it = map[idsInOrder[i]];
        if (it) reordered.push(it);
      }
      items = reordered;
      rebuildFiles();
      notify();
    }

    function setStatus(id, status) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          if (typeof status === "string") {
            items[i].status = status;
            items[i].reason = null;
          } else {
            items[i].status = "invalid";
            items[i].reason = status.invalid;
          }
          break;
        }
      }
      notify();
    }

    function getItems() {
      var result = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        result.push({
          id: it.id,
          name: it.name,
          size: it.size,
          status: it.status,
          reason: it.reason,
        });
      }
      return result;
    }

    function getFile(id) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) return items[i].file;
      }
      return null;
    }

    function canSubmit() {
      var validCount = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].status === "pending" || items[i].status === "invalid") {
          return false;
        }
        if (items[i].status === "valid") {
          validCount++;
        }
      }
      return validCount >= MIN_SOURCE_PDF_COUNT;
    }

    function onChange(fn) {
      listeners.push(fn);
    }

    return {
      add: add,
      remove: remove,
      reorder: reorder,
      setStatus: setStatus,
      items: getItems,
      getFile: getFile,
      canSubmit: canSubmit,
      onChange: onChange,
    };
  }

  // ---------------------------------------------------------------------
  // Thin controller — glues Selection to the DOM
  // ---------------------------------------------------------------------
  function init() {

    var inputEl = document.getElementById("files-input");
    if (!inputEl) return;


    var selection = createSelection(inputEl);
    var cardsContainer = document.getElementById("source-cards");
    var selectedCountEl = document.getElementById("selected-count");
    var combineBtn = document.getElementById("combine-btn");
    var combineHint = document.getElementById("combine-hint");
    var dropZone = document.getElementById("drop-zone");
    var removed = {}; // id -> true for in-flight preflight guard
    var sortableInst = null;

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

    function rejectionMessage(reason) {
      var messages = {
        "not-a-pdf": "This file is not a valid PDF",
        encrypted: "This file is password-protected",
        corrupt: "This file is corrupt or unreadable",
      };
      return messages[reason] || "This file could not be validated";
    }

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    // -------------------------------------------------------------------
    // Card rendering
    // -------------------------------------------------------------------
    function buildCardHTML(item) {
      var rejectionHtml = "";
      if (item.reason) {
        rejectionHtml =
          '<span class="card-rejection text-xs text-red-600" data-testid="card-rejection">' +
          escapeHtml(item.reason) +
          "</span>";
      }

      return (
        '<div class="source-card flex items-center gap-3 rounded border border-hairline bg-paper px-3 py-2" data-testid="source-card" data-id="' +
        escapeHtml(item.id) +
        '">' +
        '<div class="drag-handle shrink-0 cursor-grab text-muted hover:text-ink" data-testid="drag-handle" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="h-4 w-4">' +
        '<line x1="5" y1="3" x2="5" y2="13" />' +
        '<line x1="9" y1="3" x2="9" y2="13" />' +
        "</svg>" +
        "</div>" +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-accent" aria-hidden="true">' +
        '<path d="M14 11V3H6" />' +
        '<path d="M14 3L8 9L5 6L2 9" />' +
        "</svg>" +
        '<div class="flex-1 min-w-0 flex flex-col gap-0.5">' +
        '<span class="card-name truncate font-sans text-sm text-ink">' +
        escapeHtml(item.name) +
        "</span>" +
        '<span class="card-size font-sans text-xs text-muted tabular-nums">' +
        formatBytes(item.size) +
        "</span>" +
        rejectionHtml +
        "</div>" +
        '<button type="button" class="remove-card shrink-0 rounded p-1 text-muted transition-colors hover:text-red-600 hover:bg-red-50" data-testid="remove-card-button" aria-label="Remove this Source PDF">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">' +
        '<line x1="4" y1="4" x2="12" y2="12" />' +
        '<line x1="12" y1="4" x2="4" y2="12" />' +
        "</svg>" +
        "</button>" +
        "</div>"
      );
    }

    function render() {
      var items = selection.items();
      var html = "";
      for (var i = 0; i < items.length; i++) {
        html += buildCardHTML(items[i]);
      }
      cardsContainer.innerHTML = html;
      selectedCountEl.textContent = String(items.length);
      initSortable();
    }

    // -------------------------------------------------------------------
    // SortableJS setup
    // -------------------------------------------------------------------
    function initSortable() {
      if (sortableInst) {
        sortableInst.destroy();
        sortableInst = null;
      }

      var children = cardsContainer.children;
      if (children.length === 0) return;

      sortableInst = new Sortable(cardsContainer, {
        handle: ".drag-handle",
        animation: 150,
        onEnd: function (evt) {
          var ids = [];
          var cards = cardsContainer.querySelectorAll("[data-id]");
          for (var i = 0; i < cards.length; i++) {
            ids.push(cards[i].getAttribute("data-id"));
          }
          selection.reorder(ids);
        },
      });
    }

    // -------------------------------------------------------------------
    // Submit gate
    // -------------------------------------------------------------------
    function refreshSubmitGate() {
      var can = selection.canSubmit();
      combineBtn.disabled = !can;
      combineHint.style.display = can ? "none" : "block";
    }

    // -------------------------------------------------------------------
    // Preflight
    // -------------------------------------------------------------------
    function preflightFile(id, file) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", VALIDATE_URL);

      var fd = new FormData();
      fd.append("file", file);

      xhr.onload = function () {
        // Guard: file may have been removed while request was in-flight
        if (removed[id]) return;

        if (xhr.status === 200) {
          try {
            var result = JSON.parse(xhr.responseText);
            if (result.valid) {
              selection.setStatus(id, "valid");
            } else {
              selection.setStatus(id, {
                invalid: rejectionMessage(result.reason || "corrupt"),
              });
            }
          } catch (_e) {
            selection.setStatus(id, {
              invalid: rejectionMessage("corrupt"),
            });
          }
        } else {
          selection.setStatus(id, {
            invalid: rejectionMessage("corrupt"),
          });
        }
      };

      xhr.onerror = function () {
        if (xhr.status === 0) return; // aborted intentionally
        if (removed[id]) return;
        selection.setStatus(id, {
          invalid: rejectionMessage("corrupt"),
        });
      };

      xhr.send(fd);
    }

    function preflightAdded(added) {
      for (var i = 0; i < added.length; i++) {
        var file = selection.getFile(added[i].id);
        if (file) {
          preflightFile(added[i].id, file);
        }
      }
    }

    function handleRejected(rejected) {
      for (var i = 0; i < rejected.length; i++) {
        var r = rejected[i];
        if (r.reason === "not-a-pdf") {
          alert(r.name + " is not a PDF file.");
        } else if (r.reason === "over-limit") {
          alert(r.name + " would exceed the 50 MB total limit.");
        }
      }
    }

    // -------------------------------------------------------------------
    // Event wiring
    // -------------------------------------------------------------------
    selection.onChange(function () {
      render();
      refreshSubmitGate();
    });

    // Drop-zone: browse (change event on hidden file input)
    inputEl.addEventListener("change", function () {

      if (!inputEl.files || inputEl.files.length === 0) return;

      // Snapshot files into a plain array BEFORE clearing the input.
      // inputEl.files is a live FileList — clearing value empties it.
      var files = Array.prototype.slice.call(inputEl.files);

      // Reset input for re-selection edge case — clear before add
      // so rebuildFiles() inside selection.add() repopulates
      // inputEl.files for form submission.
      inputEl.value = "";

      var result = selection.add(files);
      handleRejected(result.rejected);
      preflightAdded(result.added);
      
    });

    // Card container: trash button (event delegation)
    cardsContainer.addEventListener("click", function (e) {
      var removeBtn = e.target.closest("[data-testid='remove-card-button']");
      if (!removeBtn) return;

      var card = removeBtn.closest("[data-id]");
      if (!card) return;

      var id = card.getAttribute("data-id");
      removed[id] = true;
      selection.remove(id);
    });

    // Drop-zone: drag-and-drop
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

    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("border-accent", "bg-accent/5");

      if (!e.dataTransfer || !e.dataTransfer.files) return;
      if (e.dataTransfer.files.length === 0) return;

      // Reset browse input for re-selection edge case
      inputEl.value = "";

      var result = selection.add(e.dataTransfer.files);
      handleRejected(result.rejected);
      preflightAdded(result.added);
    });

    // Initial render
    render();
    refreshSubmitGate();
    
    // Expose for e2e testing
    window.__combineSelection = selection;
  }

  // ---------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
