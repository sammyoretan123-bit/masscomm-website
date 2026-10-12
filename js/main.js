/* ============================================
   MASS COMMUNICATION DEPARTMENT WEBSITE
   File: js/main.js
   Purpose: Mobile menu toggle + dropdown toggle
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