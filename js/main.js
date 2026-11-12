/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/main.js
   Purpose: Mobile menu toggle + dropdown + site-wide lightbox with slider
   ============================================ */

/* ---------- MOBILE MENU TOGGLE ---------- */
const toggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('navLinks');

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

/* ---------- DROPDOWN TOGGLE (mobile only) ---------- */
const dropdownParents = document.querySelectorAll('.nav-links > li');

dropdownParents.forEach((parent) => {
  const link = parent.querySelector('a');
  const dropdown = parent.querySelector('.dropdown');

  if (link && dropdown) {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();

        dropdownParents.forEach((other) => {
          if (other !== parent) other.classList.remove('open');
        });

        parent.classList.toggle('open');
      }
    });
  }
});

/* ============================================
   SITE-WIDE LIGHTBOX WITH SLIDER
   Click any image to view full-size and slide through gallery
   ============================================ */

function initSiteLightbox() {
  // Only create once
  if (document.getElementById("lightbox-overlay")) return;

  // ---------- Overlay ----------
  const overlay = document.createElement("div");
  overlay.id = "lightbox-overlay";
  overlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    z-index: 9999;
    justify-content: center;
    align-items: center;
  `;

  // ---------- Image ----------
  const img = document.createElement("img");
  img.id = "lightbox-image";
  img.style.cssText = `
    max-width: 90%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.6);
  `;

  // ---------- Close Button ----------
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 30px;
    color: white;
    font-size: 45px;
    cursor: pointer;
    font-weight: bold;
    line-height: 1;
    opacity: 0.8;
    transition: opacity 0.2s;
    z-index: 10000;
  `;
  closeBtn.addEventListener("mouseenter", () => closeBtn.style.opacity = "1");
  closeBtn.addEventListener("mouseleave", () => closeBtn.style.opacity = "0.8");

  // ---------- Prev Button ----------
  const prevBtn = document.createElement("div");
  prevBtn.innerHTML = "&#10094;"; // Left arrow
  prevBtn.style.cssText = `
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-size: 50px;
    cursor: pointer;
    padding: 20px;
    opacity: 0.6;
    transition: opacity 0.2s;
    z-index: 10000;
    user-select: none;
  `;
  prevBtn.addEventListener("mouseenter", () => prevBtn.style.opacity = "1");
  prevBtn.addEventListener("mouseleave", () => prevBtn.style.opacity = "0.6");

  // ---------- Next Button ----------
  const nextBtn = document.createElement("div");
  nextBtn.innerHTML = "&#10095;"; // Right arrow
  nextBtn.style.cssText = `
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-size: 50px;
    cursor: pointer;
    padding: 20px;
    opacity: 0.6;
    transition: opacity 0.2s;
    z-index: 10000;
    user-select: none;
  `;
  nextBtn.addEventListener("mouseenter", () => nextBtn.style.opacity = "1");
  nextBtn.addEventListener("mouseleave", () => nextBtn.style.opacity = "0.6");

  // ---------- Append Elements ----------
  overlay.appendChild(closeBtn);
  overlay.appendChild(prevBtn);
  overlay.appendChild(nextBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // ---------- State ----------
  let galleryImages = [];
  let currentIndex = 0;

  // ---------- Close ----------
  function closeLightbox() {
    overlay.style.display = "none";
  }

  // ---------- Navigate ----------
  function showImage(index) {
    if (index < 0) index = galleryImages.length - 1;
    if (index >= galleryImages.length) index = 0;
    currentIndex = index;
    img.src = galleryImages[currentIndex].src;
  }

  // ---------- Event Listeners ----------
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox(); 
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (overlay.style.display !== "flex") return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    if (e.key === "ArrowRight") showImage(currentIndex + 1);
  });

  // ---------- Trigger Logic ----------
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName !== "IMG") return;
    if (target.closest("header")) return;
    if (target.closest("footer")) return;
    if (target.naturalWidth > 0 && target.naturalWidth < 80) return;

    // Find ALL images in the same container
    const container = target.closest(".gallery-grid") || target.closest(".team-grid") || target.closest(".activity-gallery") || target.parentElement;
    const containerImages = Array.from(container.querySelectorAll("img")).filter(i => i.naturalWidth > 80);

    if (containerImages.length > 1) {
      galleryImages = containerImages;
      currentIndex = galleryImages.indexOf(target);
      showImage(currentIndex);
      prevBtn.style.display = "block";
      nextBtn.style.display = "block";
    } else {
      galleryImages = [target];
      currentIndex = 0;
      showImage(currentIndex);
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }

    overlay.style.display = "flex";
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  initSiteLightbox();
});