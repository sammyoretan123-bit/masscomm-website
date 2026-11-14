/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/gallery.js
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const GALLERY_FOLDER = "content/gallery";
const GALLERY_SETTINGS_FOLDER = "content/gallery-settings";

async function listMdFiles(folder) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${folder}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files.filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep").map((f) => f.name);
  } catch (err) { return []; }
}

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
    if (rawValue === "") {
      const listItems = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        listItems.push(lines[j].replace(/^\s*-\s+/, "").replace(/^["']|["']$/g, "").trim());
        j++;
      }
      if (listItems.length > 0) { result[key] = listItems; i = j; continue; }
      result[key] = ""; i++; continue;
    }
    result[key] = rawValue.replace(/^["']|["']$/g, "");
    i++;
  }
  return { data: result };
}

async function fetchGallerySettings() {
  const defaults = { heading: "Photo Gallery", subtitle: "Moments from our events and activities" };
  try {
    const files = await listMdFiles(GALLERY_SETTINGS_FOLDER);
    if (files.length === 0) return defaults;
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GALLERY_SETTINGS_FOLDER}/${files[0]}`;
    const res = await fetch(rawUrl);
    if (!res.ok) return defaults;
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return { heading: data.heading || defaults.heading, subtitle: data.subtitle || defaults.subtitle };
  } catch (err) { return defaults; }
}

async function fetchGallerySection(fileName) {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GALLERY_FOLDER}/${fileName}`;
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error("Not found: " + fileName);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      fileName,
      title: data.title || 'Gallery',
      order: parseInt(data.order) || 999,
      photos: Array.isArray(data.photos) ? data.photos : []
    };
  } catch (err) { return null; }
}

async function renderGallery() {
  const container = document.getElementById("gallery-sections");
  if (!container) return;

  const settings = await fetchGallerySettings();
  const headingEl = document.getElementById("gallery-heading");
  const subtitleEl = document.getElementById("gallery-subtitle");
  if (headingEl) headingEl.textContent = settings.heading;
  if (subtitleEl) subtitleEl.textContent = settings.subtitle;

  const files = await listMdFiles(GALLERY_FOLDER);
  const sections = (await Promise.all(files.map(fetchGallerySection))).filter(Boolean);
  sections.sort((a, b) => a.order - b.order);

  if (sections.length === 0) {
    container.innerHTML = `<p style="text-align:center; width:100%; color:#666; padding: 30px;">Gallery is being updated. Please check back soon.</p>`;
    return;
  }

  container.innerHTML = sections.map((s) => {
    const photosHTML = s.photos.length
      ? `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px;">
          ${s.photos.map((img) => `
            <img src="${img}" alt="${s.title}" 
                 style="width: 100%; height: 350px; object-fit: contain; background: #f0f0f0; border-radius: 8px; padding: 5px;" />
          `).join("")}
        </div>`
      : `<p style="text-align:center; color:#666; padding:20px; margin-bottom: 30px;">Photos are being updated.</p>`;

    return `
      <section class="gallery-section" style="margin-bottom: 40px;">
        <h2 style="color: #6a0dad; margin-bottom: 20px; text-transform: uppercase; text-align: center;">${s.title}</h2>
        ${photosHTML}
      </section>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => { renderGallery(); });