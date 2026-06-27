/**
 * Client-side hash listener for home page category links.
 * Toggles aria-current and visual active styling on PDF Tools / QR Tools
 * nav links when the URL fragment changes.  Only runs on the home page.
 */
(function () {
  "use strict";

  if (window.location.pathname !== "/") return;

  var pdfLink = /** @type {HTMLAnchorElement | null} */ (
    document.querySelector('[data-testid="nav-pdf-tools"]')
  );
  var qrLink = /** @type {HTMLAnchorElement | null} */ (
    document.querySelector('[data-testid="nav-qr-tools"]')
  );

  var ACTIVE = [
    "text-accent",
    "underline",
    "underline-offset-4",
    "decoration-accent",
  ];
  var INACTIVE = "text-ink-soft";

  /**
   * @param {HTMLAnchorElement} link
   */
  function deactivate(link) {
    link.removeAttribute("aria-current");
    link.classList.remove.apply(link.classList, ACTIVE);
    link.classList.add(INACTIVE);
  }

  /**
   * @param {HTMLAnchorElement} link
   */
  function activate(link) {
    link.setAttribute("aria-current", "page");
    link.classList.add.apply(link.classList, ACTIVE);
    link.classList.remove(INACTIVE);
  }

  function updateActive() {
    if (!pdfLink || !qrLink) return;

    var hash = window.location.hash;

    // Reset both links to inactive state
    deactivate(pdfLink);
    deactivate(qrLink);

    if (hash === "#pdf-tools") {
      activate(pdfLink);
    } else if (hash === "#qr-tools") {
      activate(qrLink);
    }
    // No hash or unrecognized hash → both stay inactive
  }

  window.addEventListener("hashchange", updateActive);
  document.addEventListener("DOMContentLoaded", updateActive);
})();
