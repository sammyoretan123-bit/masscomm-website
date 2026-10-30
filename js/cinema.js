// --- GLOBAL VARIABLES ---
const moviesGrid = document.getElementById("movies-grid");
const videoModal = document.getElementById("video-modal");
const videoContainer = document.getElementById("video-container");

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
    // Fallback to the department logo if no poster is provided
    banner.style.backgroundImage = `url('${featuredMovie.poster_url || 'images/mass communication logo.jpg'}')`;
    
    document.getElementById("featured-title").textContent = featuredMovie.title;
    document.getElementById("featured-desc").textContent = featuredMovie.description || '';
    
    // Save the video ID to a global variable so the Play button knows what to play
    window.currentFeaturedVideo = featuredMovie.video_id;
  }

  // 2. RENDER THE REST OF THE GRID (Starting from the second movie)
  const gridMovies = data.slice(1); 

  if (gridMovies.length === 0) {
    moviesGrid.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1;"></p>`; // Hide loading text if empty
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
  
  // Assuming you are using YouTube links. 
  // We use replace to ensure we get the embed link.
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  
  videoContainer.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  videoModal.classList.add("show");
}

function closeVideo() {
  videoModal.classList.remove("show");
  // Clear the iframe to stop the video from playing in the background
  videoContainer.innerHTML = ""; 
}

// --- INITIALIZATION ---
// This forces the movies to load immediately when the page opens
document.addEventListener("DOMContentLoaded", loadMovies);