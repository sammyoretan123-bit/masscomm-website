/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/hod.js
   Purpose: Load current HOD + past HOD history
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const HOD_FOLDER = "content/hod";
const HOD_HISTORY_FOLDER = "content/hod-history";

/* ---------- 1. GET CURRENT HOD FILE ---------- */
async function getHodSlug() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${HOD_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    const mdFile = files.find((f) => f.name.endsWith(".md") && f.name !== ".gitkeep");
    return mdFile ? mdFile.name.replace(".md", "") : null;
  } catch (err) {
    console.warn("Could not fetch HOD:", err);
    return null;
  }
}

/* ---------- 2. PARSE FRONT-MATTER (handles multi-line) ---------- */
function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };

  const frontMatter = match[1];
  const body = match[2] ? match[2].trim() : "";
  const lines = frontMatter.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();

    if (/^[|>][-+]?$/.test(rawValue)) {
      const isFolded = rawValue.startsWith(">");
      const blockLines = [];
      i++;
      while (i < lines.length && (lines[i].startsWith("  ") || !lines[i].trim())) {
        blockLines.push(lines[i].replace(/^\s{2}/, ""));
        i++;
      }
      result[key] = isFolded ? blockLines.join(" ").trim() : blockLines.join("\n").trim();
      continue;
    }

    result[key] = rawValue.replace(/^["']|["']$/g, "");
    i++;
  }

  return { data: result, body };
}

/* ---------- 3. FETCH CURRENT HOD ---------- */
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

/* ---------- 4. PAST HODs ---------- */
async function getPastHodSlugs() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${HOD_HISTORY_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch past HODs:", err);
    return [];
  }
}

async function fetchPastHod(slug) {
  try {
    const res = await fetch(`content/hod-history/${slug}.md`);
    if (!res.ok) throw new Error("Not found: " + slug);
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return {
      slug,
      name: data.name || slug,
      photo: data.photo || "images/mass communication logo.jpg",
      years: data.years || "",
      order: parseInt(data.order) || 999
    };
  } catch (err) {
    console.warn("Could not load past HOD:", slug, err);
    return null;
  }
}

/* ---------- 5. RENDER CURRENT HOD ---------- */
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

  profileContainer.innerHTML = `
    <div class="member">
      <img src="${hod.photo}" alt="${hod.name}" />
      <h3>${hod.name}</h3>
      <p class="role">${hod.role}</p>
    </div>
  `;

  if (messageContainer && hod.message) {
    const paragraphs = hod.message
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("");

    messageContainer.innerHTML = `
      <h2 style="color: #6a0dad; margin-bottom: 15px;">Welcome Message from the HOD</h2>
      ${paragraphs}
      <br />
      <p style="font-weight: bold; color: #6a0dad;">&mdash; ${hod.name}, ${hod.role}</p>
    `;
  } else if (messageContainer) {
    messageContainer.innerHTML = `
      <h2 style="color: #6a0dad; margin-bottom: 15px;">Welcome Message from the HOD</h2>
      <p style="color:#666;">Welcome message is being updated.</p>
    `;
  }
}

/* ---------- 6. RENDER PAST HODs ---------- */
async function renderPastHods() {
  const container = document.getElementById("past-hods-grid");
  if (!container) return;

  const slugs = await getPastHodSlugs();
  const hods = (await Promise.all(slugs.map(fetchPastHod))).filter(Boolean);

  // Sort: most recent first (lower order number = newer)
  hods.sort((a, b) => a.order - b.order);

  if (hods.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        Past HOD information is being updated. Please check back soon.
      </p>`;
    return;
  }

  container.innerHTML = hods.map((h) => `
    <div class="member">
      <img src="${h.photo}" alt="${h.name}" />
      <h3>${h.name}</h3>
      <p class="role">${h.years}</p>
    </div>
  `).join("");
}

/* ---------- 7. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHod();
  renderPastHods();
});