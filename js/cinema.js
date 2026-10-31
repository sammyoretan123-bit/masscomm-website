// --- GLOBAL VARIABLES ---
const moviesGrid = document.getElementById("movies-grid");
const videoModal = document.getElementById("video-modal");
const videoContainer = document.getElementById("video-container");
let allMoviesData = []; 

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  const searchBar = document.getElementById("search-bar");

  // 1. Load the movies immediately on page load
  loadMovies(); 

  // 2. Handle Search Bar Typing
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      handleSearch(searchTerm);
    });
  }
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

  // 2. RENDER THE GRID (Show ALL movies in the grid)
  const gridMovies = allMoviesData; 

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
  videoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
  videoModal.classList.add("show");
}

function closeVideo() {
  videoModal.classList.remove("show");
  videoContainer.innerHTML = ""; 
}