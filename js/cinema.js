// --- GLOBAL VARIABLES ---
const moviesGrid = document.getElementById("movies-grid");
const videoModal = document.getElementById("video-modal");
const videoContainer = document.getElementById("video-container");
let allMoviesData = []; 

// --- AUTHENTICATION & UI LOGIC ---
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const moviesSection = document.getElementById("movies-section");
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const logoutBtn = document.getElementById("logout-btn");
  const searchBar = document.getElementById("search-bar");

  // 1. Check if user is already logged in on page load
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    loginSection.style.display = "none";
    moviesSection.style.display = "block";
    loadMovies(); 
  } else {
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
      loginStatus.style.background = "#28a745";
      loginStatus.textContent = "Login successful! Loading movies...";
      
      loginSection.style.display = "none";
      moviesSection.style.display = "block";
      loadMovies();
    }
  });

  // 3. Handle Logout Button
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
  });

  // 4. Handle Search Bar Typing
  searchBar.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    handleSearch(searchTerm);
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

  allMoviesData = data;

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

  // 2. RENDER THE GRID (Exclude the #1 featured movie from the grid)
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

// --- NEW SEARCH & RENDER LOGIC (NETFLIX STYLE) ---
function handleSearch(searchTerm) {
  const searchResultsContainer = document.getElementById("search-results");
  const normalBrowsingArea = document.getElementById("normal-browsing-area");

  // If the search bar is empty, show the normal banner and grid again
  if (searchTerm === "") {
    searchResultsContainer.style.display = "none";
    normalBrowsingArea.style.display = "block";
    return;
  }

  // Otherwise, hide the banner/grid and show search results
  searchResultsContainer.style.display = "block";
  normalBrowsingArea.style.display = "none";

  // Filter movies based on title OR description
  const filteredMovies = allMoviesData.filter(movie => 
    (movie.title && movie.title.toLowerCase().includes(searchTerm)) || 
    (movie.description && movie.description.toLowerCase().includes(searchTerm))
  );

  if (filteredMovies.length === 0) {
    searchResultsContainer.innerHTML = `<p style="text-align:center; color:#aaa; padding: 40px;">No results found for "${searchTerm}".</p>`;
    return;
  }

  // Render the wide Netflix-style layout
  searchResultsContainer.innerHTML = `
    <div class="search-result-layout">
      <h3 style="color: #aaa; margin-bottom: 10px;">Search Results for "${searchTerm}"</h3>
      ${filteredMovies.map(movie => `
        <div class="search-item" onclick="playMovie('${movie.video_id}')">
          <img class="search-item-img" src="${movie.poster_url || 'images/mass communication logo.jpg'}" alt="${movie.title}" />
          <div class="search-item-info">
            <h3>${movie.title}</h3>
            <p>${movie.description || 'No description available.'}</p>
            <div>
              <button class="play-btn-wide">▶ Play</button>
              <span class="movie-category" style="margin-left: 15px;">${movie.category || 'Movie'}</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
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