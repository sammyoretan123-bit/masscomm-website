/* ============================================
   File: js/cinema.js
   Purpose: Auth + Netflix-style grid
   ============================================ */

const loginSection = document.getElementById("login-section");
const moviesSection = document.getElementById("movies-section");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");
const moviesGrid = document.getElementById("movies-grid");
const videoModal = document.getElementById("video-modal");
const videoContainer = document.getElementById("video-container");

// --- AUTH LOGIC ---
function showLogin() {
  loginSection.style.display = "block";
  moviesSection.style.display = "none";
}

function showMovies() {
  loginSection.style.display = "none";
  moviesSection.style.display = "block";
  loadMovies();
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginStatus.style.display = "block";
    loginStatus.textContent = "Logging in...";
    loginStatus.style.background = "#333";
    loginStatus.style.color = "#fff";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    });

    if (error) {
      loginStatus.textContent = "❌ " + error.message;
      loginStatus.style.color = "#e50914";
      return;
    }

    loginForm.reset();
    showMovies();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });
}

// --- MOVIE FETCHING LOGIC ---
async function loadMovies() {
  moviesGrid.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1;">Loading movies...</p>`;

  const { data, error } = await supabaseClient
    .from("cinema")
    .select("*");

  if (error) {
    moviesGrid.innerHTML = `<p style="text-align:center; color:#e50914; grid-column: 1/-1;">Error loading movies: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    moviesGrid.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1;">No movies uploaded yet.</p>`;
    return;
  }

  // Render the Netflix Grid
  moviesGrid.innerHTML = data.map((movie) => `
    <div class="movie-card" onclick="playMovie('${movie.video_id}')">
      <img src="${movie.poster_url || 'images/mass communication logo.jpg'}" alt="${movie.title}" />
      <div class="movie-info">
        <h3 style="color: #fff;">${movie.title}</h3>
        <p>${movie.description || ''}</p>
        <span style="font-size: 0.7rem; color: #e50914; text-transform: uppercase;">${movie.category || 'Movie'}</span>
      </div>
    </div>
  `).join("");
}

// --- VIDEO PLAYER LOGIC ---
function playMovie(videoId) {
  if (!videoId) return;
  // Using YouTube embed URL
  videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  videoModal.style.display = "flex";
}

function closeVideo() {
  videoModal.style.display = "none";
  videoContainer.innerHTML = ""; // Stop the video when closed
}

// --- CHECK SESSION ON LOAD ---
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data && data.session && data.session.user) {
    showMovies();
  } else {
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded", checkSession);