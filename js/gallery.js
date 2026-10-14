/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/gallery.js
   Purpose: Load gallery sections + settings
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const GALLERY_FOLDER = "content/gallery";
const GALLERY_SETTINGS_FOLDER = "content/gallery-settings";

/* ---------- 1. LIST FILES ---------- */
async function listMdFiles(folder) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${folder}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch folder:", folder, err);
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

/* ---------- 3. FETCH GALLERY SETTINGS ---------- */
async function fetchGallerySettings() {
  const defaults = {
    heading: "Photo Gallery",
    subtitle: "Moments from our events and activities"
  };

  try {
    const slugs = await listMdFiles(GALLERY_SETTINGS_FOLDER);
    if (slugs.length === 0) return defaults;

    const res = await fetch(`content/gallery-settings/${slugs[0]}.md`);
    if (!res.ok) return defaults;
    const text = await res.text();
    const { data } = parseFrontMatter(text);

    return {
      heading: data.heading || defaults.heading,
      subtitle: data.subtitle || defaults.subtitle
    };
  } catch (err) {
    console.warn("Could not load gallery settings:", err);
    return defaults;
  }
}

/* ---------- 4. FETCH ONE GALLERY SECTION ---------- */
async function fetchGallerySection(slug) {
  try {
    const res = await fetch(`content/gallery/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      title: data.title || slug,
      order: parseInt(data.order) || 999,
      photos: Array.isArray(data.photos) ? data.photos : []
    };
  } catch (err) {
    console.warn("Could not load gallery section:", slug, err);
    return null;
  }
}

/* ---------- 5. RENDER GALLERY PAGE ---------- */
async function renderGallery() {
  const container = document.getElementById("gallery-sections");
  if (!container) return;

  // Load settings
  const settings = await fetchGallerySettings();
  const headingEl = document.getElementById("gallery-heading");
  const subtitleEl = document.getElementById("gallery-subtitle");
  if (headingEl) headingEl.textContent = settings.heading;
  if (subtitleEl) subtitleEl.textContent = settings.subtitle;

  // Load sections
  const slugs = await listMdFiles(GALLERY_FOLDER);
  const sections = (await Promise.all(slugs.map(fetchGallerySection))).filter(Boolean);

  sections.sort((a, b) => a.order - b.order);

  if (sections.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Gallery is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = sections.map((s) => {
    const photosHTML = s.photos.length
      ? `<div class="gallery-grid">
          ${s.photos.map((img) => `<img src="${img}" alt="${s.title}" />`).join("")}
        </div>`
      : `<p style="text-align:center; color:#666; padding:20px;">Photos are being updated.</p>`;

    return `
      <section class="gallery-section">
        <h2>${s.title}</h2>
        ${photosHTML}
      </section>
    `;
  }).join("");
}

/* ---------- 6. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderGallery();
});