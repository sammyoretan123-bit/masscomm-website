// --- GLOBAL VARIABLES ---
const moviesGrid = document.getElementById("movies-grid");
const videoModal = document.getElementById("video-modal");
const videoContainer = document.getElementById("video-container");

// --- AUTHENTICATION & UI LOGIC ---
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const moviesSection = document.getElementById("movies-section");
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const logoutBtn = document.getElementById("logout-btn");

  // 1. Check if user is already logged in on page load
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    // User is logged in
    loginSection.style.display = "none";
    moviesSection.style.display = "block";
    loadMovies(); // Fetch the movies!
  } else {
    // User is NOT logged in
    loginSection.style.display = "block";
    moviesSection.style.display = "none";
  }

  // 2. Handle Login Form Submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    loginStatus.style.display = "block";
    loginStatus.style.background = "#333";
    loginStatus.style.color = "#fff";
    loginStatus.textContent = "Logging in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      loginStatus.style.background = "#e50914";
      loginStatus.textContent = "Login failed: " + error.message;
    } else {
      // Login successful!
      loginStatus.style.background = "#28a745";
      loginStatus.textContent = "Login successful! Loading movies...";
      
      // Switch screens
      loginSection.style.display = "none";
      moviesSection.style.display = "block";
      loadMovies();
    }
  });

  // 3. Handle Logout Button
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    // Refresh the page to reset the view
    window.location.reload();
  });
});


// --- MOVIE FETCHING LOGIC ---
async function loadMovies() {
  moviesGrid.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1;">Loading movies...</p>`;

  const { data, error } = await supabaseClient
    .from("cinema")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    moviesGrid.innerHTML = `<p style="text-align:center; color:#e50914; grid-column: 1/-1;">Error loading movies: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    moviesGrid.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1;">No movies uploaded yet.</p>`;
    return;
  }

  // 1. SET THE FEATURED BANNER (The first movie)
  const featuredMovie = data[0];
  const banner = document.getElementById("featured-banner");
  
  if (banner && featuredMovie) {
    banner.style.display = "block";
    banner.style.backgroundImage = `url('${featuredMovie.poster_url || 'images/mass communication logo.jpg'}')`;
    
    document.getElementById("featured-title").textContent = featuredMovie.title;
    document.getElementById("featured-desc").textContent = featuredMovie.description || '';
    
    window.currentFeaturedVideo = featuredMovie.video_id;
  }

  // 2. RENDER THE REST OF THE GRID
  const gridMovies = data.slice(1); 

  if (gridMovies.length === 0) {
    moviesGrid.innerHTML = ``; 
    return;
  }

  moviesGrid.innerHTML = gridMovies.map((movie) => `
    <div class="movie-card" onclick="playMovie('${movie.video_id}')">
      <div class="poster-container">
        <img src="${movie.poster_url || 'images/mass communication logo.jpg'}" alt="${movie.title}" />
        <div class="poster-overlay">
          <div class="play-circle">▶</div>
        </div>
      </div>
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p>${movie.description || ''}</p>
        <span class="movie-category">${movie.category || 'Movie'}</span>
      </div>
    </div>
  `).join("");
}

// --- PLAY FEATURED MOVIE LOGIC ---
function playFeatured() {
  if (window.currentFeaturedVideo) {
    playMovie(window.currentFeaturedVideo);
  }
}

// --- VIDEO PLAYER MODAL LOGIC ---
function playMovie(videoId) {
  if (!videoId) return;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  videoContainer.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  videoModal.classList.add("show");
}

function closeVideo() {
  videoModal.classList.remove("show");
  videoContainer.innerHTML = ""; 
}