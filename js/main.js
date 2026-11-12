/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/main.js
   Purpose: Mobile menu toggle + dropdown + site-wide lightbox + conditional navbar
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
   CONDITIONAL NAVBAR (Hide Course Materials if logged in)
   ============================================ */
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof supabaseClient !== 'undefined') {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      const navLinks = document.querySelectorAll('.nav-links a');
      
      navLinks.forEach(link => {
        if (link.textContent.trim() === "Course Materials" || link.href.includes("materials.html")) {
          const listItem = link.parentElement;
          
          if (session) {
            // IF LOGGED IN: Hide it
            listItem.style.display = "none";
          } else {
            // IF LOGGED OUT: Show it
            listItem.style.display = "block";
          }
        }
      });
    } catch (err) {
      console.error("Error checking auth for navbar:", err);
    }
  }
});

/* ============================================
   SITE-WIDE LIGHTBOX
   ============================================ */

function initSiteLightbox() {
  if (document.getElementById("lightbox-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "lightbox-overlay";
  overlay.style.cssText = `display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; justify-content: center; align-items: center; cursor: zoom-out; padding: 30px;`;

  const img = document.createElement("img");
  img.id = "lightbox-image";
  img.style.cssText = `max-width: 95%; max-height: 92vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 50px rgba(0,0,0,0.6);`;

  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `position: absolute; top: 15px; right: 30px; color: white; font-size: 45px; cursor: pointer; font-weight: bold; line-height: 1; opacity: 0.8; transition: opacity 0.2s; z-index: 10000;`;
  closeBtn.addEventListener("mouseenter", () => closeBtn.style.opacity = "1");
  closeBtn.addEventListener("mouseleave", () => closeBtn.style.opacity = "0.8");
  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); overlay.style.display = "none"; });

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", () => overlay.style.display = "none");
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.style.display = "none"; });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName !== "IMG") return;
    if (target.closest("header")) return;
    if (target.closest("footer")) return;
    if (target.naturalWidth > 0 && target.naturalWidth < 80) return;
    img.src = target.src;
    overlay.style.display = "flex";
  });
}

document.addEventListener("DOMContentLoaded", () => { initSiteLightbox(); });