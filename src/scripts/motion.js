/* ============================================================
   Scroll motion — GSAP + ScrollTrigger.

   Rules this file follows:
   · Everything here is enhancement. The page must read correctly with
     this file deleted, so nothing starts hidden or dimmed from CSS —
     the driver adds the .driven class before it dims anything.
   · No scroll-jacking: pinning advances at the reader's own scroll rate
     and never scrubs the page for them.
   · Disabled entirely under prefers-reduced-motion and below 940px,
     where pinning fights mobile browser chrome.
   ============================================================ */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- parallax (all viewports) ----------
   Depth cues only: layers that should feel further away move less. */
function parallax() {
  // Hero backdrop drifts slower than the page, so the blurred photo reads
  // as distance behind the panel.
  const slides = document.querySelector(".hero-slider .slides");
  if (slides) {
    gsap.to(slides, {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-slider",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }

  // The hero panel rises slightly against the scroll — it is the nearest
  // object in the scene, so it should move most.
  const panel = document.querySelector(".hero-panel");
  if (panel) {
    gsap.to(panel, {
      yPercent: -9,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-slider",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }

  // Ambient light fields drift at their own rate.
  gsap.utils.toArray(".glow").forEach((el, i) => {
    gsap.to(el, {
      yPercent: i % 2 ? 18 : -18,
      ease: "none",
      scrollTrigger: {
        trigger: el.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  // Deliberately NOT parallaxing the poster thumbnails: GSAP writes an
  // inline transform, which would override the CSS hover zoom on the same
  // image. The cards already carry tilt, specular and gloss — a fourth
  // effect on twelve images buys nothing and costs scroll performance.
}

/* ---------- pinned process narrative (desktop only) ---------- */
function pinnedProcess() {
  const scroller = document.querySelector(".how-scroller");
  const visual = document.querySelector(".how-visual");
  const panel = document.querySelector(".how-panel");
  const stepEls = gsap.utils.toArray(".how-scroller .step");
  const imgs = gsap.utils.toArray(".how-img");
  const readouts = gsap.utils.toArray(".how-readout-item");
  if (!scroller || !visual || !panel || stepEls.length === 0) return;

  // Only now does dimming become safe: the driver is definitely running.
  scroller.classList.add("driven");

  let current = -1;
  const activate = (i) => {
    if (i === current) return;
    current = i;
    stepEls.forEach((el, x) => el.classList.toggle("active", x === i));
    imgs.forEach((el, x) => el.classList.toggle("active", x === i));
    readouts.forEach((el, x) => el.classList.toggle("active", x === i));
    // Step 3 is the sublimation step — the panel heats.
    panel.classList.toggle("heating", i === 2);
  };
  activate(0);

  // Pin the visual for exactly the distance the step column outruns it, so
  // the panel releases precisely as the last step finishes — never before,
  // and never holding the reader after there is nothing left to read.
  ScrollTrigger.create({
    trigger: scroller,
    start: "top 18%",
    end: () => `+=${Math.max(0, scroller.offsetHeight - visual.offsetHeight - 40)}`,
    pin: visual,
    pinSpacing: false,
    invalidateOnRefresh: true,
  });

  // Each step claims the visual while it occupies the middle of the screen.
  stepEls.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 62%",
      end: "bottom 38%",
      onToggle: (self) => self.isActive && activate(i),
    });
  });
}

/* No GSAP entrance animations here on purpose. The poster cards already
   carry [data-reveal], which staggers them via its own IntersectionObserver
   and a per-card --d delay. Layering a gsap.from() on the same elements
   wrote an inline opacity:0 that outranked the reveal CSS and left the
   grid invisible whenever the trigger had not fired yet. */

function init() {
  if (reduce) return;
  parallax();
  if (matchMedia("(min-width: 940px)").matches) pinnedProcess();

  // Images arriving late change the page height; recalculate once settled.
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

init();
