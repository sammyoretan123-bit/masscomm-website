/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/main.js
   Purpose: Mobile menu + dropdown + Slider Lightbox + Zoom & Pan
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
   SITE-WIDE LIGHTBOX WITH SLIDER, ZOOM & PAN
   ============================================ */

function initSiteLightbox() {
  if (document.getElementById("lightbox-overlay")) return;

  // ---------- Overlay ----------
  const overlay = document.createElement("div");
  overlay.id = "lightbox-overlay";
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.95);
    z-index: 9999;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 20px; /* Added padding to keep image away from edges */
    box-sizing: border-box;
  `;

  // ---------- Image Container ----------
  const imageContainer = document.createElement("div");
  imageContainer.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  `;

  // ---------- Image ----------
  const img = document.createElement("img");
  img.id = "lightbox-image";
  img.style.cssText = `
    max-width: 85%; /* Reduced from 100% */
    max-height: 85vh; /* Keeps it within screen bounds */
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.6);
    transition: transform 0.1s ease-out;
    user-select: none;
    cursor: grab;
  `;

  // ---------- Close Button ----------
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: fixed; top: 20px; right: 20px; color: white; font-size: 35px;
    cursor: pointer; font-weight: bold; z-index: 10000; opacity: 0.9;
    background: rgba(0,0,0,0.6); border-radius: 50%; width: 45px; height: 45px;
    display: flex; justify-content: center; align-items: center; line-height: 1;
    border: 1px solid rgba(255,255,255,0.2);
  `;

  // ---------- Prev Button ----------
  const prevBtn = document.createElement("div");
  prevBtn.innerHTML = "&#10094;";
  prevBtn.style.cssText = `
    position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
    color: white; font-size: 40px; cursor: pointer; padding: 10px;
    opacity: 0.6; z-index: 10000; user-select: none; display: none;
  `;

  // ---------- Next Button ----------
  const nextBtn = document.createElement("div");
  nextBtn.innerHTML = "&#10095;";
  nextBtn.style.cssText = `
    position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
    color: white; font-size: 40px; cursor: pointer; padding: 10px;
    opacity: 0.6; z-index: 10000; user-select: none; display: none;
  `;

  // Append elements
  imageContainer.appendChild(img);
  overlay.appendChild(imageContainer);
  overlay.appendChild(closeBtn);
  overlay.appendChild(prevBtn);
  overlay.appendChild(nextBtn);
  document.body.appendChild(overlay);

  // ---------- State ----------
  let galleryImages = [];
  let currentIndex = 0;
  let scale = 1;
  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;

  // ---------- Helper Functions ----------
  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
  }

  function updateImageTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function closeLightbox() {
    overlay.style.display = "none";
    document.body.style.overflow = "auto"; 
    resetZoom();
  }

  function showImage(index) {
    if (index < 0) index = galleryImages.length - 1;
    if (index >= galleryImages.length) index = 0;
    currentIndex = index;
    img.src = galleryImages[currentIndex].src;
    resetZoom();
  }

  // ---------- Event Listeners ----------

  // Close
  closeBtn.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox(); 
  });

  // Navigation
  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (overlay.style.display !== "flex") return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    if (e.key === "ArrowRight") showImage(currentIndex + 1);
  });

  // Zooming (Mouse Wheel)
  img.addEventListener("wheel", (e) => {
    e.preventDefault(); 
    const zoomSensitivity = 0.1;
    
    if (e.deltaY < 0) {
      scale += zoomSensitivity; 
    } else {
      scale -= zoomSensitivity; 
    }

    if (scale < 1) scale = 1;
    if (scale > 4) scale = 4;

    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }

    updateImageTransform();
  }, { passive: false });

  // Panning
  img.addEventListener("mousedown", (e) => {
    if (scale <= 1) return; 
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateImageTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    if (scale > 1) img.style.cursor = "grab";
    else img.style.cursor = "default";
  });

  // ---------- Trigger Logic ----------
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName !== "IMG") return;
    if (target.closest("header")) return;
    if (target.closest("footer")) return;
    if (target.naturalWidth > 0 && target.naturalWidth < 80) return;

    // Check if the clicked image is inside a profile card
    const isProfileCard = target.closest(".member");

    const container = target.closest(".gallery-grid") || target.closest(".team-grid") || target.closest(".activity-gallery") || target.parentElement;
    const containerImages = Array.from(container.querySelectorAll("img")).filter(i => i.naturalWidth > 80);

    if (containerImages.length > 1 && !isProfileCard) {
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
    document.body.style.overflow = "hidden"; 
    img.style.cursor = "default";
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  initSiteLightbox();
});