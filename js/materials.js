/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/materials.js
   Purpose: Display materials (Secure / Logged in only)
   ============================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. SECURITY CHECK ---
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    // If not logged in, redirect to login page immediately
    window.location.href = "login.html";
    return;
  }

  // --- 2. USER IS LOGGED IN, PROCEED ---
  // Show the section that is hidden by default in the HTML
  const materialsSection = document.getElementById("materials-section");
  if (materialsSection) {
    materialsSection.style.display = "block";
  }

  // Grab DOM elements
  const materialsList = document.getElementById("materials-list");
  const filterLevel = document.getElementById("filter-level");
  const filterSemester = document.getElementById("filter-semester");
  const filterCategory = document.getElementById("filter-category");
  const filterSearch = document.getElementById("filter-search");

  let allMaterials = [];

  // --- 3. LOAD MATERIALS FROM SUPABASE ---
  async function loadMaterials() {
    if (!materialsList) return; 

    materialsList.innerHTML = `<p style="text-align:center; color:#666;">Loading materials...</p>`;

    const { data, error } = await supabaseClient
      .from("materials")
      .select("*")
      .order("course_code", { ascending: true });

    if (error) {
      materialsList.innerHTML = `<p style="text-align:center; color:#c0392b;">Error loading materials: ${error.message}</p>`;
      return;
    }

    allMaterials = data || [];
    renderMaterials();
  }

  // --- 4. RENDER MATERIALS ---
  function renderMaterials() {
    const level = filterLevel ? filterLevel.value : "";
    const semester = filterSemester ? filterSemester.value : "";
    const category = filterCategory ? filterCategory.value : "";
    const search = filterSearch ? filterSearch.value.trim().toLowerCase() : "";

    let filtered = allMaterials.filter((m) => {
      if (level && m.level !== level) return false;
      if (semester && m.semester !== semester) return false;
      if (category && (m.category || "").toUpperCase() !== category.toUpperCase()) return false;
      
      if (search) {
        const haystack = `${m.course_code || ""} ${m.title || ""} ${m.category || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      materialsList.innerHTML = `
        <div style="background:#fff; padding:40px; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); text-align:center;">
          <p style="color:#666; font-size:1.05rem;">No materials match your filters yet.</p>
        </div>`;
      return;
    }

    materialsList.innerHTML = filtered.map((m) => {
      const isPastQuestion = (m.category || "").toUpperCase().includes("PAST QUESTION");
      const badgeColor = isPastQuestion ? "#c0392b" : "#6a0dad";

      return `
      <div style="background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); padding:22px 25px; margin-bottom:18px; border-left:6px solid #6a0dad;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div style="flex:1; min-width:220px;">
            <p style="margin:0 0 5px; color:#6a0dad; font-weight:bold; font-size:0.9rem;">
              ${m.course_code || ""} &bull; ${m.level || ""} &bull; ${m.semester || ""} Semester
            </p>
            <h3 style="margin:0 0 8px; color:#0d0d0d;">${m.title || "Untitled"}</h3>
            ${m.description ? `<p style="margin:0 0 10px; color:#555; font-size:0.95rem;">${m.description}</p>` : ""}
            <span style="display:inline-block; background:${badgeColor}; color:white; padding:3px 12px; border-radius:20px; font-size:0.75rem; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">
              ${m.category || "Material"}
            </span>
          </div>
          <div style="display:flex; align-items:center;">
            <a href="${m.file_url}" target="_blank" rel="noopener" class="btn" style="white-space:nowrap; padding:10px 20px; font-size:0.9rem;">
              Download PDF
            </a>
          </div>
        </div>
      </div>
    `}).join("");
  }

  // --- 5. FILTER EVENTS ---
  [filterLevel, filterSemester, filterCategory].forEach((el) => {
    if (el) el.addEventListener("change", renderMaterials);
  });

  if (filterSearch) {
    filterSearch.addEventListener("input", renderMaterials);
  }

  // --- 6. INITIALIZE ---
  loadMaterials();
});