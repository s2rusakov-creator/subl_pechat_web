(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav ---------- */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- scroll reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- hero panel: develop sequence ---------- */
  var stage = document.getElementById("panelStage");
  var temp = document.getElementById("tempReadout");
  var state = document.getElementById("stateReadout");

  if (stage && temp && state) {
    if (reducedMotion) {
      temp.textContent = "199.4°C";
      state.textContent = "Dye infused";
      stage.classList.add("developed");
    } else {
      var DELAY = 700;      // ms before the press starts
      var SWEEP = 2400;     // must match CSS press-sweep duration
      setTimeout(function () {
        stage.classList.add("developed");
        state.textContent = "Infusing dye";
        var start = null;
        var tick = function (now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / SWEEP, 1);
          // ease-out climb from ambient to press temperature
          var eased = 1 - Math.pow(1 - t, 3);
          var value = 24 + (199.4 - 24) * eased;
          temp.textContent = value.toFixed(1) + "°C";
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            state.textContent = "Dye infused";
          }
        };
        requestAnimationFrame(tick);
      }, DELAY);
    }
  }

  /* ---------- hero panel: cursor sheen + tilt ---------- */
  var frame = document.getElementById("metalFrame");
  var panel = document.getElementById("panel");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  if (frame && panel && finePointer && !reducedMotion) {
    frame.addEventListener("mousemove", function (e) {
      var r = frame.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;   // 0..1
      var y = (e.clientY - r.top) / r.height;
      panel.style.setProperty("--mx", (x * 100).toFixed(1));
      panel.style.setProperty("--my", (y * 100).toFixed(1));
      frame.style.setProperty("--tilt-y", ((x - 0.5) * 5).toFixed(2));
      frame.style.setProperty("--tilt-x", ((0.5 - y) * 5).toFixed(2));
    });
    frame.addEventListener("mouseleave", function () {
      frame.style.setProperty("--tilt-y", "0");
      frame.style.setProperty("--tilt-x", "0");
    });
  }

  /* ---------- hero: specular light raking across the metal ---------- */
  var hero = document.querySelector(".press-hero");
  if (hero && finePointer && !reducedMotion) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--sx", (((e.clientX - r.left) / r.width) * 100).toFixed(1));
    });
  }
})();
