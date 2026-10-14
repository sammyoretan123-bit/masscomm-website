/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/executives.js
   Purpose: Load current executives + past administrations
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const EXECUTIVES_FOLDER = "content/executives";
const PAST_EXECUTIVES_FOLDER = "content/past-executives";

/* ---------- 1. LIST FILES ---------- */
async function listMdFiles(folder) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${folder}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch folder:", folder, err);
    return [];
  }
}

/* ---------- 2. PARSE FRONT-MATTER ---------- */
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

/* ---------- 3. FETCH ONE EXECUTIVE ---------- */
async function fetchExecutive(folder, slug) {
  try {
    const res = await fetch(`${folder}/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      name: data.name || slug,
      position: data.position || "Executive",
      photo: data.photo || "images/mass communication logo.jpg",
      order: parseInt(data.order) || 999,
      admin_name: data.admin_name || "",
      set_year: data.set_year || "",
      admin_order: parseInt(data.admin_order) || 999
    };
  } catch (err) {
    console.warn("Could not load executive:", slug, err);
    return null;
  }
}

/* ---------- 4. RENDER CURRENT EXECUTIVES ---------- */
async function renderCurrentExecutives() {
  const container = document.getElementById("executives-grid");
  if (!container) return;

  const slugs = await listMdFiles(EXECUTIVES_FOLDER);
  const execs = (await Promise.all(slugs.map((s) => fetchExecutive("content/executives", s))))
    .filter(Boolean);

  execs.sort((a, b) => a.order - b.order);

  if (execs.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Executive information is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = execs.map((e) => `
    <div class="member">
      <img src="${e.photo}" alt="${e.name}" />
      <h3>${e.name}</h3>
      <p class="role">${e.position}</p>
    </div>
  `).join("");
}

/* ---------- 5. RENDER PAST ADMINISTRATIONS ---------- */
async function renderPastExecutives() {
  const container = document.getElementById("past-executives-list");
  if (!container) return;

  const slugs = await listMdFiles(PAST_EXECUTIVES_FOLDER);
  const execs = (await Promise.all(slugs.map((s) => fetchExecutive("content/past-executives", s))))
    .filter(Boolean);

  if (execs.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Past administration information is being updated. Please check back soon.
      </p>`;
    return;
  }

  // Group by administration name + set year
  const groups = {};
  execs.forEach((e) => {
    const key = `${e.admin_name}|||${e.set_year}`;
    if (!groups[key]) {
      groups[key] = {
        admin_name: e.admin_name || "Past Administration",
        set_year: e.set_year || "",
        admin_order: e.admin_order,
        members: []
      };
    }
    groups[key].members.push(e);
  });

  // Convert to array and sort by admin_order
  const groupArray = Object.values(groups);
  groupArray.sort((a, b) => a.admin_order - b.admin_order);

  // Sort members within each group by position order
  groupArray.forEach((g) => {
    g.members.sort((a, b) => a.order - b.order);
  });

  container.innerHTML = groupArray.map((g) => `
    <div style="background:#fff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); overflow:hidden; margin-bottom:40px;">

      <!-- Header -->
      <div style="background:#6a0dad; color:#fff; padding:18px 25px;">
        <h3 style="margin:0; font-size:1.4rem;">${g.admin_name}</h3>
        ${g.set_year ? `<p style="margin:5px 0 0; opacity:0.9; font-size:0.9rem;">Set: ${g.set_year}</p>` : ""}
      </div>

      <!-- Members Grid -->
      <div style="padding:25px; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:20px;">
        ${g.members.map((m) => `
          <div style="text-align:center;">
            <img src="${m.photo}" alt="${m.name}" style="width:120px; height:120px; object-fit:cover; border-radius:50%; border:4px solid #6a0dad;" />
            <h4 style="margin:12px 0 3px; color:#0d0d0d; font-size:1rem;">${m.name}</h4>
            <p style="margin:0; color:#6a0dad; font-weight:bold; text-transform:uppercase; font-size:0.75rem; letter-spacing:0.5px;">${m.position}</p>
          </div>
        `).join("")}
      </div>

    </div>
  `).join("");
}

/* ---------- 6. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCurrentExecutives();
  renderPastExecutives();
});