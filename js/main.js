/* ============================================================
   PhotoRetouch Pro — Script principal (comportements communs)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Menu mobile
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      const icon = navToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-xmark");
      }
    });
    navLinks.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => navLinks.classList.remove("open"));
    });
  }

  // Marquer le lien de nav actif
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) link.classList.add("active");
  });

  // Animation "reveal" au scroll
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  }

  // Sliders avant/après
  document.querySelectorAll(".ba-slider").forEach(initBeforeAfterSlider);
});

function initBeforeAfterSlider(slider) {
  const beforeImg = slider.querySelector(".ba-before");
  const divider = slider.querySelector(".ba-divider");
  const handle = slider.querySelector(".ba-handle");
  let dragging = false;

  function setPosition(percent) {
    percent = Math.max(0, Math.min(100, percent));
    beforeImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    divider.style.left = percent + "%";
    handle.style.left = percent + "%";
  }

  function getPercentFromEvent(e) {
    const rect = slider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return ((clientX - rect.left) / rect.width) * 100;
  }

  slider.addEventListener("mousedown", (e) => { dragging = true; setPosition(getPercentFromEvent(e)); });
  slider.addEventListener("touchstart", (e) => { dragging = true; setPosition(getPercentFromEvent(e)); });
  window.addEventListener("mousemove", (e) => { if (dragging) setPosition(getPercentFromEvent(e)); });
  window.addEventListener("touchmove", (e) => { if (dragging) setPosition(getPercentFromEvent(e)); });
  window.addEventListener("mouseup", () => dragging = false);
  window.addEventListener("touchend", () => dragging = false);

  // Position initiale
  setPosition(50);
}
