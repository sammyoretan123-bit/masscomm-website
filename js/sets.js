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

/* ---------- 2. PARSE FRONT-MATTER (handles lists) ---------- */
function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {} };

  const fm = match[1];
  const lines = fm.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();

    // Block scalar
    if (/^[|>][-+]?$/.test(rawValue)) {
      const blockLines = [];
      i++;
      while (i < lines.length && (lines[i].startsWith("  ") || !lines[i].trim())) {
        blockLines.push(lines[i].replace(/^\s{2}/, ""));
        i++;
      }
      result[key] = blockLines.join("\n").trim();
      continue;
    }

    // Empty → could be a list
    if (rawValue === "") {
      const listItems = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        listItems.push(lines[j].replace(/^\s*-\s+/, "").replace(/^["']|["']$/g, "").trim());
        j++;
      }
      if (listItems.length > 0) {
        result[key] = listItems;
        i = j;
        continue;
      }
      result[key] = "";
      i++;
      continue;
    }

    result[key] = rawValue.replace(/^["']|["']$/g, "");
    i++;
  }

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
      set_name: data.set_name || "",
      year: data.year || "",
      level: data.level || "",
      rep_name: data.rep_name || "",
      rep_photo: data.rep_photo || "images/mass communication logo.jpg",
      gallery: Array.isArray(data.gallery) ? data.gallery : []
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

  // Sort: newest year first
  sets.sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  if (sets.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Set information is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = sets.map((s) => {
    const title = s.set_name || (s.year + " Set");

    // Build gallery HTML
    const galleryHTML = s.gallery.length
      ? `<div class="gallery-grid">
          ${s.gallery.map((img) => `<img src="${img}" alt="${title} photo" />`).join("")}
        </div>`
      : `<p style="text-align:center; color:#666; padding:20px;">Photos are being updated.</p>`;

    return `
      <div style="background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); overflow:hidden; margin-bottom:40px;">

        <!-- Header: Set Name + Year + Level -->
        <div style="background:#6a0dad; color:#fff; padding:18px 25px;">
          <h3 style="margin:0; font-size:1.4rem;">${title}</h3>
          <p style="margin:5px 0 0; opacity:0.9; font-size:0.9rem;">${s.year} &bull; ${s.level}</p>
        </div>

        <!-- Content -->
        <div style="padding:25px;">

          <!-- Class Rep -->
          <div style="text-align:center; margin-bottom:25px;">
            <img src="${s.rep_photo}" alt="${s.rep_name}" style="width:150px; height:150px; object-fit:cover; border-radius:50%; border:4px solid #6a0dad;" />
            <h4 style="margin:15px 0 5px; color:#0d0d0d;">${s.rep_name}</h4>
            <p style="margin:0; color:#6a0dad; font-weight:bold; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.5px;">Class Rep</p>
          </div>

          <!-- Photo Gallery -->
          <h4 style="color:#6a0dad; margin-bottom:15px; text-align:center;">Photo Gallery</h4>
          ${galleryHTML}

        </div>
      </div>
    `;
  }).join("");
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderSets();
});