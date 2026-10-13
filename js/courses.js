/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/courses.js
   Purpose: Auto-load courses from content/courses/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const COURSES_FOLDER = "content/courses";

/* ---------- 1. GET COURSE FILES ---------- */
async function getCourseSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${COURSES_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();

    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch course list:", err);
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

/* ---------- 3. FETCH ONE COURSE ---------- */
async function fetchCourse(slug) {
  try {
    const res = await fetch(`content/courses/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      code: data.code || "",
      title: data.title || slug,
      description: data.description || "",
      lecturer_name: data.lecturer_name || "",
      lecturer_title: data.lecturer_title || "",
      post: data.post || ""
    };
  } catch (err) {
    console.warn("Could not load course:", slug, err);
    return null;
  }
}

/* ---------- 4. SORT COURSES BY CODE ---------- */
function sortByCode(a, b) {
  return a.code.localeCompare(b.code);
}

/* ---------- 5. RENDER COURSES LIST ---------- */
async function renderCourses() {
  const container = document.getElementById("course-list");
  if (!container) return;

  const slugs = await getCourseSlugs();
  const courses = (await Promise.all(slugs.map(fetchCourse))).filter(Boolean);

  courses.sort(sortByCode);

  if (courses.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        No courses listed yet. Add one in the admin panel.
      </p>`;
    return;
  }

  container.innerHTML = courses.map((c) => `
    <div class="course-item">
      ${c.code ? `<span class="code">${c.code}</span>` : ""}
      <h3>${c.title}</h3>
      ${c.description ? `<p>${c.description}</p>` : ""}
      ${c.lecturer_name ? `
        <p style="margin-top:10px; font-size:0.9rem; color:#555;">
          <strong style="color:#6a0dad;">Lecturer:</strong>
          ${c.lecturer_title ? c.lecturer_title + " " : ""}${c.lecturer_name}
          ${c.post ? ` &bull; <em>${c.post}</em>` : ""}
        </p>
      ` : ""}
    </div>
  `).join("");
}

/* ---------- 6. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCourses();
});