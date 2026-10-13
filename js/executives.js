/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/executives.js
   Purpose: Auto-load executives from content/executives/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const EXECUTIVES_FOLDER = "content/executives";

/* ---------- 1. GET EXECUTIVE FILES ---------- */
async function getExecutiveSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${EXECUTIVES_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch executives:", err);
    return [];
  }
}

/* ---------- 2. PARSE FRONT-MATTER ---------- */
function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };

  const frontMatter = match[1];
  const body = match[2] ? match[2].trim() : "";

  frontMatter.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    result[key] = value;
  });

  return { data: result, body };
}

/* ---------- 3. FETCH ONE EXECUTIVE ---------- */
async function fetchExecutive(slug) {
  try {
    const res = await fetch(`content/executives/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      name: data.name || slug,
      position: data.position || "Executive",
      photo: data.photo || "images/mass communication logo.jpg",
      order: parseInt(data.order) || 999
    };
  } catch (err) {
    console.warn("Could not load executive:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER EXECUTIVES GRID ---------- */
async function renderExecutives() {
  const container = document.getElementById("executives-grid");
  if (!container) return;

  const slugs = await getExecutiveSlugs();
  const executives = (await Promise.all(slugs.map(fetchExecutive)))
    .filter(Boolean);

  // Sort by "order" number (President = 1, VP = 2, etc.)
  executives.sort((a, b) => a.order - b.order);

  if (executives.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        No executives listed yet. Add one in the admin panel.
      </p>`;
    return;
  }

  container.innerHTML = executives.map((e) => `
    <div class="member">
      <img src="${e.photo}" alt="${e.name}" />
      <h3>${e.name}</h3>
      <p class="role">${e.position}</p>
    </div>
  `).join("");
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderExecutives();
});