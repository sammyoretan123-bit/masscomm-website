/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/sets.js
   Purpose: Auto-load student sets from content/sets/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const SETS_FOLDER = "content/sets";

/* ---------- 1. GET SET FILES ---------- */
async function getSetSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${SETS_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch sets:", err);
    return [];
  }
}

/* ---------- 2. PARSE FRONT-MATTER ---------- */
function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {} };
  const frontMatter = match[1];
  frontMatter.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    result[key] = value;
  });
  return { data: result };
}

/* ---------- 3. FETCH ONE SET ---------- */
async function fetchSet(slug) {
  try {
    const res = await fetch(`content/sets/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      year: data.year || "",
      level: data.level || "",
      rep_name: data.rep_name || "",
      rep_photo: data.rep_photo || "images/mass communication logo.jpg",
      group_photo: data.group_photo || "images/mass communication logo.jpg"
    };
  } catch (err) {
    console.warn("Could not load set:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER SETS ---------- */
async function renderSets() {
  const container = document.getElementById("sets-list");
  if (!container) return;

  const slugs = await getSetSlugs();
  const sets = (await Promise.all(slugs.map(fetchSet))).filter(Boolean);

  // Sort: newest set first
  sets.sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  if (sets.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Set information is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = sets.map((s) => `
    <div style="background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); overflow:hidden; margin-bottom:40px;">

      <!-- Header: Year + Level -->
      <div style="background:#6a0dad; color:#fff; padding:18px 25px;">
        <h3 style="margin:0; font-size:1.4rem;">${s.year} Set</h3>
        <p style="margin:5px 0 0; opacity:0.9; font-size:0.9rem;">${s.level}</p>
      </div>

      <!-- Content: Rep + Group Photo -->
      <div style="display:flex; flex-wrap:wrap; gap:25px; padding:25px;">

        <!-- Class Rep -->
        <div style="flex:1; min-width:220px; text-align:center;">
          <img src="${s.rep_photo}" alt="${s.rep_name}" style="width:150px; height:150px; object-fit:cover; border-radius:50%; border:4px solid #6a0dad;" />
          <h4 style="margin:15px 0 5px; color:#0d0d0d;">${s.rep_name}</h4>
          <p style="margin:0; color:#6a0dad; font-weight:bold; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.5px;">Class Rep</p>
        </div>

        <!-- Group Photo -->
        <div style="flex:2; min-width:280px;">
          <img src="${s.group_photo}" alt="${s.year} Set Group Photo" style="width:100%; max-height:350px; object-fit:cover; border-radius:10px;" />
          <p style="text-align:center; margin-top:12px; color:#666; font-size:0.9rem; font-style:italic;">${s.year} Set Group Photo</p>
        </div>

      </div>
    </div>
  `).join("");
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderSets();
});