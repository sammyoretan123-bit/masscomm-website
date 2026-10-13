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

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (posts.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Blog posts are being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = posts.map((p) => `
    <a href="blog-post.html?id=${p.slug}" class="blog-card">
      ${p.cover ? `<img src="${p.cover}" alt="${p.title}" />` : ""}
      <div class="blog-info">
        <p class="author">By ${p.author} &bull; ${p.date}</p>
        <h3>${p.title}</h3>
        <p>${truncate(p.body, 180)}</p>
      </div>
    </a>
  `).join("");
}

/* ---------- 6. RENDER BLOG DETAIL ---------- */
async function renderBlogPost() {
  const container = document.getElementById("blog-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("id");

  if (!slug) {
    container.innerHTML = "<p>No blog post selected.</p>";
    return;
  }

  const post = await fetchBlogPost(slug);
  if (!post) {
    container.innerHTML = "<p>Blog post not found.</p>";
    return;
  }

  document.title = post.title + " | Mass Communication Department";

  const coverHTML = post.cover
    ? `<img src="${post.cover}" alt="${post.title}" style="width:100%; max-width:900px; border-radius:12px; margin-bottom:25px; display:block; margin-left:auto; margin-right:auto;" />`
    : "";

  // Convert line breaks to paragraphs
  const bodyHTML = post.body
    .split("\n\n")
    .map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`)
    .join("");

  container.innerHTML = `
    <h1 style="color:#6a0dad; margin-bottom:15px; font-size:2.2rem;">${post.title}</h1>
    <p style="color:#6a0dad; font-weight:bold; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:25px;">
      By ${post.author} &bull; ${post.date}
    </p>
    ${coverHTML}
    <div style="text-align:left; max-width:800px; margin:0 auto; line-height:1.9; font-size:1.05rem; color:#333;">
      ${bodyHTML}
    </div>
  `;
}

/* ---------- 7. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderBlog();
  renderBlogPost();
});