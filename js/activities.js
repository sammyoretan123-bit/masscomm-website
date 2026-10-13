/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/activities.js
   Purpose: Auto-load activities from content/activities/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const ACTIVITIES_FOLDER = "content/activities";

/* ---------- 1. GET ACTIVITY FILES FROM GITHUB ---------- */
async function getActivitySlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${ACTIVITIES_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch activity list:", err);
    return [];
  }
}

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

  // Parse gallery array
  const galleryMatch = frontMatter.match(/gallery:\s*\n((?:\s*-\s*.+\n?)*)/);
  if (galleryMatch) {
    const items = galleryMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-"))
      .map((l) => l.replace(/^-\s*/, "").replace(/^["']|["']$/g, ""));
    result.gallery = items;
  }

  return { data: result, body };
}

/* ---------- 3. FETCH ONE ACTIVITY ---------- */
async function fetchActivity(slug) {
  try {
    const res = await fetch(`content/activities/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data, body } = parseFrontMatter(text);
    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      cover: data.cover || "",
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
      body
    };
  } catch (err) {
    console.warn("Could not load activity:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER LIST ---------- */
async function renderActivitiesList() {
  const container = document.getElementById("activities-live-grid");
  if (!container) return;

  const slugs = await getActivitySlugs();
  const activities = (await Promise.all(slugs.map(fetchActivity)))
    .filter(Boolean);

  if (activities.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
         Activity information is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = activities.map((a) => `
    <a href="activity.html?id=${a.slug}" class="activity-card">
      <img src="${a.cover}" alt="${a.title}" />
      <div class="activity-info">
        <h3>${a.title}</h3>
        <p>${a.description}</p>
      </div>
    </a>
  `).join("");
}

/* ---------- 5. RENDER DETAIL ---------- */
async function renderActivityDetail() {
  const container = document.getElementById("activity-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("id");

  if (!slug) {
    container.innerHTML = "<p>No activity selected.</p>";
    return;
  }

  const a = await fetchActivity(slug);

  if (!a) {
    container.innerHTML = "<p>Activity not found.</p>";
    return;
  }

  document.title = a.title + " | Mass Communication Department";

  const coverHTML = a.cover
    ? `<img src="${a.cover}" alt="${a.title}" style="width:100%; max-width:800px; border-radius:12px; margin-bottom:20px;" />`
    : "";

  const galleryHTML = a.gallery.length
    ? `<div class="gallery-grid">
        ${a.gallery.map((img) => `<img src="${img}" alt="${a.title}" />`).join("")}
      </div>`
    : "";

  container.innerHTML = `
    <h1 style="color:#6a0dad; margin-bottom:10px;">${a.title}</h1>
    <p style="max-width:700px; margin:0 auto 30px; color:#555;">${a.description}</p>
    ${coverHTML}
    ${galleryHTML}
  `;
}

/* ---------- 6. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderActivitiesList();
  renderActivityDetail();
});