/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/hod.js
   Purpose: Auto-load HOD from content/hod/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const HOD_FOLDER = "content/hod";

/* ---------- 1. GET HOD FILE ---------- */
async function getHodSlug() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${HOD_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    const mdFile = files.find(
      (f) => f.name.endsWith(".md") && f.name !== ".gitkeep"
    );

    return mdFile ? mdFile.name.replace(".md", "") : null;
  } catch (err) {
    console.warn("Could not fetch HOD:", err);
    return null;
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

/* ---------- 3. FETCH HOD ---------- */
async function fetchHod(slug) {
  try {
    const res = await fetch(`content/hod/${slug}.md`);
    if (!res.ok) throw new Error("Not found");
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      name: data.name || slug,
      role: data.role || "Head of Department",
      photo: data.photo || "images/mass communication logo.jpg",
      message: data.message || ""
    };
  } catch (err) {
    console.warn("Could not load HOD:", err);
    return null;
  }
}

/* ---------- 4. RENDER HOD ---------- */
async function renderHod() {
  const profileContainer = document.getElementById("hod-profile");
  const messageContainer = document.getElementById("hod-message");
  if (!profileContainer) return;

  const slug = await getHodSlug();
  if (!slug) {
    profileContainer.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
              HOD information is being updated. Please check back soon.
      </p>`;
    return;
  }

  const hod = await fetchHod(slug);
  if (!hod) return;

  // Profile card
  profileContainer.innerHTML = `
    <div class="member">
      <img src="${hod.photo}" alt="${hod.name}" />
      <h3>${hod.name}</h3>
      <p class="role">${hod.role}</p>
    </div>
  `;

  // Welcome message
  if (messageContainer && hod.message) {
    messageContainer.innerHTML = `
      <h2 style="color: #6a0dad; margin-bottom: 15px;">Welcome Message from the HOD</h2>
      <p>${hod.message.replace(/\n\n/g, "</p><br /><p>")}</p>
      <br />
      <p style="font-weight: bold; color: #6a0dad;">&mdash; ${hod.name}, ${hod.role}</p>
    `;
  }
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHod();
});