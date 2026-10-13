/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/blog.js
   Purpose: Auto-load blog posts from content/blog/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const BLOG_FOLDER = "content/blog";

/* ---------- 1. GET BLOG FILES ---------- */
async function getBlogSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${BLOG_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch blog list:", err);
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

/* ---------- 3. FETCH ONE BLOG POST ---------- */
async function fetchBlogPost(slug) {
  try {
    const res = await fetch(`content/blog/${slug}.md`);
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
    console.warn("Could not load blog post:", slug, err);
    return null;
  }
}

/* ---------- 4. TRUNCATE BODY FOR PREVIEW ---------- */
function truncate(text, length) {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/* ---------- 5. RENDER BLOG LIST ---------- */
async function renderBlog() {
  const container = document.getElementById("blog-list");
  if (!container) return;

  const slugs = await getBlogSlugs();
  const posts = (await Promise.all(slugs.map(fetchBlogPost))).filter(Boolean);

  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (posts.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        No blog posts yet. Add one in the admin panel.
      </p>`;
    return;
  }

  container.innerHTML = posts.map((p) => `
    <div class="blog-card">
      ${p.cover ? `<img src="${p.cover}" alt="${p.title}" />` : ""}
      <div class="blog-info">
        <p class="author">By ${p.author} &bull; ${p.date}</p>
        <h3>${p.title}</h3>
        <p>${truncate(p.body, 180)}</p>
      </div>
    </div>
  `).join("");
}

/* ---------- 6. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderBlog();
});