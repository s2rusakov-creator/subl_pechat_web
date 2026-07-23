/* Prints UAE — casual shop.
   Renders the poster grid + filter chips from posters.json, and wires
   each poster to open WhatsApp with the design name pre-filled.
   To manage the shop, edit posters.json — you never need to touch this file. */
(function () {
  "use strict";

  var grid = document.getElementById("posters-grid");
  var chipsWrap = document.getElementById("chips");

  wireNav();

  fetch("posters.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {
      if (grid) grid.innerHTML = '<p style="color:var(--muted)">Couldn\'t load the catalogue. Make sure the site is opened via its web address (http://…), not a local file.</p>';
    });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(data) {
    var wa = (data.whatsapp || "").replace(/[^0-9]/g, "");
    var fromDefault = data.fromPrice || 120;
    var cats = ["all"].concat(data.categories || []);

    // filter chips
    chipsWrap.innerHTML = cats.map(function (c, i) {
      var filter = c === "all" ? "all" : c.toLowerCase();
      var label = c === "all" ? "All" : c;
      return '<button class="chip' + (i === 0 ? " active" : "") + '" data-filter="' + filter + '">' + esc(label) + "</button>";
    }).join("");

    // poster cards
    grid.innerHTML = (data.posters || []).map(function (p) {
      var cat = p.category || "";
      var price = p.fromPrice || fromDefault;
      var msg = 'Hi Prints UAE! I\'d like to order the "' + p.title + '" poster.\nSize: \nName: ';
      var href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(msg);
      return '<a class="poster-card" data-cat="' + esc(cat.toLowerCase()) + '" href="' + href + '" target="_blank" rel="noopener" aria-label="Order the ' + esc(p.title) + ' poster on WhatsApp">' +
        '<div class="poster-thumb"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.alt || p.title) + '" /></div>' +
        '<div class="poster-meta"><div class="poster-top">' +
        '<span class="poster-title">' + esc(p.title) + "</span>" +
        '<span class="poster-price">from AED ' + esc(price) + "</span></div>" +
        '<div class="poster-cat">' + esc(cat) + "</div></div></a>";
    }).join("");

    wireFilter();
  }

  function wireFilter() {
    var chips = chipsWrap.querySelectorAll(".chip");
    var cards = grid.querySelectorAll(".poster-card");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.classList.toggle("active", c === chip); });
        cards.forEach(function (card) {
          card.style.display = (f === "all" || card.getAttribute("data-cat") === f) ? "" : "none";
        });
      });
    });
  }

  function wireNav() {
    var nav = document.querySelector(".nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      links.addEventListener("click", function (e) { if (e.target.tagName === "A") links.classList.remove("open"); });
    }
  }
})();
