/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/about.js
   Purpose: Auto-load About page content from content/about/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const ABOUT_FOLDER = "content/about";

/* ---------- 1. LIST FILES ---------- */
async function listAboutFiles() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${ABOUT_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    return files
      .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
      .map((f) => f.name.replace(".md", ""));
  } catch (err) {
    console.warn("Could not fetch about list:", err);
    return [];
  }
}

/* ---------- 2. PARSE FRONT-MATTER (handles lists) ---------- */
function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {} };

  const fm = match[1];
  const lines = fm.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();

    // Block scalar (multi-line text)
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

    // Empty → could be a list
    if (rawValue === "") {
      const listItems = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        listItems.push(lines[j].replace(/^\s*-\s+/, "").replace(/^["']|["']$/g, "").trim());
        j++;
      }
      if (listItems.length > 0) {
        result[key] = listItems;
        i = j;
        continue;
      }
      result[key] = "";
      i++;
      continue;
    }

    result[key] = rawValue.replace(/^["']|["']$/g, "");
    i++;
  }

  return { data: result };
}

/* ---------- 3. FETCH ABOUT DATA ---------- */
async function fetchAbout() {
  const slugs = await listAboutFiles();
  if (slugs.length === 0) return null;

  try {
    const res = await fetch(`content/about/${slugs[0]}.md`);
    if (!res.ok) throw new Error("Not found");
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return data;
  } catch (err) {
    console.warn("Could not load about:", err);
    return null;
  }
}

/* ---------- 4. RENDER ABOUT PAGE ---------- */
async function renderAbout() {
  const container = document.getElementById("about-content");
  if (!container) return;

  const data = await fetchAbout();

  if (!data) {
    container.innerHTML = `
      <p style="text-align:center; width:100%; color:#666;">
        About information is being updated. Please check back soon.
      </p>`;
    return;
  }

  // Page heading + subtitle
  const headingEl = document.getElementById("about-heading");
  const subtitleEl = document.getElementById("about-subtitle");
  if (headingEl) headingEl.textContent = data.heading || "About the Department";
  if (subtitleEl) subtitleEl.textContent = data.subtitle || "";

  if (data.heading) {
    document.title = data.heading + " | Mass Communication Department";
  }

  // Who We Are
  const whoHTML = data.who_we_are
    ? `<h2 style="color: #6a0dad; margin-bottom: 15px;">Who We Are</h2>
       <p>${data.who_we_are.replace(/\n/g, "<br />")}</p>
       <br />`
    : "";

  // Mission
  const missionHTML = data.mission
    ? `<h2 style="color: #6a0dad; margin-bottom: 15px;">Our Mission</h2>
       <p>${data.mission.replace(/\n/g, "<br />")}</p>
       <br />`
    : "";

  // Vision
  const visionHTML = data.vision
    ? `<h2 style="color: #6a0dad; margin-bottom: 15px;">Our Vision</h2>
       <p>${data.vision.replace(/\n/g, "<br />")}</p>
       <br />`
    : "";

  // Programmes
  const programmesHTML = Array.isArray(data.programmes) && data.programmes.length
    ? `<h2 style="color: #6a0dad; margin-bottom: 15px;">Programmes Offered</h2>
       <ul style="margin-left: 20px; line-height: 2;">
         ${data.programmes.map((p) => `<li>${p}</li>`).join("")}
       </ul>
       <br />`
    : "";

  // Student Association
  const assocHTML = data.student_association
    ? `<h2 style="color: #6a0dad; margin-bottom: 15px;">Student Association</h2>
       <p>${data.student_association.replace(/\n/g, "<br />")}</p>`
    : "";

  container.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; text-align: left; background: #fff; padding: 35px; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
      ${whoHTML}
      ${missionHTML}
      ${visionHTML}
      ${programmesHTML}
      ${assocHTML}
    </div>
  `;
}

/* ---------- 5. RUN ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderAbout();
});