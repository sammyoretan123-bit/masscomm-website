/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/sequence.js
   Purpose: Filter lecturers by sequence (PRAD / Broadcast / Print)
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const LECTURERS_FOLDER = "content/lecturers";

async function getLecturerSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${LECTURERS_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch lecturer list:", err);
    return [];
  }
}

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
      photo: data.photo || "images/mass communication logo.jpg",
      sequence: data.sequence || ""
    };
  } catch (err) {
    console.warn("Could not load lecturer:", slug, err);
    return null;
  }
}

async function renderSequenceLecturers() {
  const container = document.getElementById("sequence-lecturers");
  if (!container) return;

  // Get sequence from page filename: "sequence-broadcast.html" → "broadcast"
  const page = window.location.pathname.split("/").pop().replace(".html", "");
  const targetSequence = page.replace("sequence-", "").toLowerCase();

  const slugs = await getLecturerSlugs();
  const lecturers = (await Promise.all(slugs.map(fetchLecturer)))
    .filter(Boolean)
    .filter((l) => (l.sequence || "").toLowerCase() === targetSequence);

  if (lecturers.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Lecturer information is being updated. Please check back soon.
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

document.addEventListener("DOMContentLoaded", () => {
  renderSequenceLecturers();
});