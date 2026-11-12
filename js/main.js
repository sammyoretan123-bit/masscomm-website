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
    inset: 0;
    background: rgba(0,0,0,0.92);
    z-index: 9999;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  `;

  // ---------- Image Container (For Panning) ----------
  const imageContainer = document.createElement("div");
  imageContainer.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    overflow: hidden;
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
    transition: transform 0.1s ease-out;
    user-select: none;
    pointer-events: auto;
  `;

  // ---------- Close Button ----------
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute; top: 15px; right: 30px; color: white; font-size: 45px;
    cursor: pointer; font-weight: bold; z-index: 10000; opacity: 0.8;
  `;

  // ---------- Prev Button ----------
  const prevBtn = document.createElement("div");
  prevBtn.innerHTML = "&#10094;";
  prevBtn.style.cssText = `
    position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
    color: white; font-size: 50px; cursor: pointer; padding: 20px;
    opacity: 0.6; z-index: 10000; user-select: none;
  `;

  // ---------- Next Button ----------
  const nextBtn = document.createElement("div");
  nextBtn.innerHTML = "&#10095;";
  nextBtn.style.cssText = `
    position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
    color: white; font-size: 50px; cursor: pointer; padding: 20px;
    opacity: 0.6; z-index: 10000; user-select: none;
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
    document.body.style.overflow = "auto"; // UNLOCK PAGE SCROLL
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
    if (e.target === overlay || e.target === imageContainer) closeLightbox(); 
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
  imageContainer.addEventListener("wheel", (e) => {
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
  imageContainer.addEventListener("mousedown", (e) => {
    if (scale <= 1) return; 
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    imageContainer.style.cursor = "grabbing";
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
    if (scale > 1) imageContainer.style.cursor = "grab";
    else imageContainer.style.cursor = "default";
  });

  // ---------- Trigger Logic ----------
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName !== "IMG") return;
    if (target.closest("header")) return;
    if (target.closest("footer")) return;
    if (target.naturalWidth > 0 && target.naturalWidth < 80) return;

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
    document.body.style.overflow = "hidden"; // LOCK PAGE SCROLL
    imageContainer.style.cursor = "default";
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  initSiteLightbox();
});