/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/lecturers.js
   Purpose: Load lecturers from content/lecturers/*.md
   ============================================ */

/* ---------- 1. LIST OF LECTURER FILES ---------- */
/* When you add a new lecturer in the admin panel,
   add its slug (filename without .md) to this list. */

const LECTURER_FILES = [
  dr.-ishola-lamidi
];

/* ---------- 2. PARSE FRONT-MATTER FROM MARKDOWN ---------- */
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

/* ---------- 3. FETCH ONE LECTURER ---------- */
async function fetchLecturer(slug) {
  try {
    const res = await fetch(`content/lecturers/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      name: data.name || slug,
      role: data.role || "Lecturer",
      photo: data.photo || "images/mass communication logo.jpg"
    };
  } catch (err) {
    console.warn("Could not load lecturer:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER LECTURERS GRID ---------- */
async function renderLecturers() {
  const container = document.getElementById("lecturers-grid");
  if (!container) return;

  const lecturers = (await Promise.all(LECTURER_FILES.map(fetchLecturer)))
    .filter(Boolean);

  if (lecturers.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        No lecturers listed yet. Add one in the admin panel.
      </p>`;
    return;
  }

  container.innerHTML = lecturers.map((l) => `
    <div class="member">
      <img src="${l.photo}" alt="${l.name}" />
      <h3>${l.name}</h3>
      <p class="role">${l.role}</p>
    </div>
  `).join("");
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderLecturers();
});