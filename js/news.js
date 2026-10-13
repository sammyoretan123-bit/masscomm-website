/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/news.js
   Purpose: Auto-load news from content/news/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const NEWS_FOLDER = "content/news";

/* ---------- 1. GET NEWS FILES ---------- */
async function getNewsSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${NEWS_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch news list:", err);
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

/* ---------- 3. FETCH ONE NEWS ITEM ---------- */
async function fetchNews(slug) {
  try {
    const res = await fetch(`content/news/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data, body } = parseFrontMatter(text);
    return {
      slug,
      title: data.title || slug,
      author: data.author || "Mass Comm Dept",
      date: data.date || "",
      cover: data.cover || "",
      body
    };
  } catch (err) {
    console.warn("Could not load news:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER NEWS LIST ---------- */
async function renderNews() {
  const container = document.getElementById("news-list");
  if (!container) return;

  const slugs = await getNewsSlugs();
  const items = (await Promise.all(slugs.map(fetchNews))).filter(Boolean);

  // Sort by date (newest first) - parse "DD Month YYYY" format
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (items.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        No news yet. Add one in the admin panel.
      </p>`;
    return;
  }

  container.innerHTML = items.map((n) => `
    <div class="news-item">
      <p class="date">${n.date} &mdash; by ${n.author}</p>
      <h3>${n.title}</h3>
      <p>${n.body}</p>
    </div>
  `).join("");
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderNews();
});