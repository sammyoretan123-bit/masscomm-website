/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/sequence.js
   Purpose: Load sequence page content + lecturers
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const LECTURERS_FOLDER = "content/lecturers";

/* ---------- 1. GET CURRENT SEQUENCE SLUG ---------- */
function getSequenceSlug() {
  const page = window.location.pathname.split("/").pop().replace(".html", "");
  return page.replace("sequence-", "").toLowerCase();
}

/* ---------- 2. PARSE FRONT-MATTER (handles scalars, multiline, lists) ---------- */
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

    // Block scalar: |, |-, >, >-
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

    // Empty value → could be a list
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

/* ---------- 3. FETCH SEQUENCE DATA ---------- */
async function fetchSequence(slug) {
  try {
    const res = await fetch(`content/sequences/${slug}.md`);
    if (!res.ok) throw new Error("Not found");
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return data;
  } catch (err) {
    console.warn("Could not load sequence:", slug, err);
    return null;
  }
}

/* ---------- 4. FETCH LECTURERS ---------- */
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
    return null;
  }
}

/* ---------- 5. RENDER SEQUENCE PAGE ---------- */
async function renderSequencePage() {
  const slug = getSequenceSlug();
  const seq = await fetchSequence(slug);

  // Title + Subtitle
  const titleEl = document.getElementById("seq-title");
  const subtitleEl = document.getElementById("seq-subtitle");
  if (titleEl) titleEl.textContent = (seq && seq.title) ? seq.title : "Sequence";
  if (subtitleEl) subtitleEl.textContent = (seq && seq.subtitle) ? seq.subtitle : "";

  if (seq && seq.title) {
    document.title = seq.title + " | Mass Communication Department";
  }

  // Description
  const descEl = document.getElementById("seq-description");
  if (descEl) {
    if (seq && seq.description) {
      descEl.innerHTML = seq.description
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
        .join("");
    } else {
      descEl.innerHTML = "<p>Information is being updated. Please check back soon.</p>";
    }
  }

  // What You'll Learn
  const learnEl = document.getElementById("seq-learn");
  if (learnEl) {
    if (seq && Array.isArray(seq.learn) && seq.learn.length) {
      learnEl.innerHTML = seq.learn.map((item) => `<li>${item}</li>`).join("");
    } else {
      learnEl.innerHTML = "<li>Information is being updated.</li>";
    }
  }

  // Related Courses
  const coursesEl = document.getElementById("seq-courses");
  if (coursesEl) {
    if (seq && Array.isArray(seq.courses) && seq.courses.length) {
      coursesEl.innerHTML = seq.courses.map((c) => `<li>${c}</li>`).join("");
    } else {
      coursesEl.innerHTML = "<li>Information is being updated.</li>";
    }
  }

  // Photo Gallery
  const galleryEl = document.getElementById("seq-gallery");
  if (galleryEl) {
    if (seq && Array.isArray(seq.gallery) && seq.gallery.length) {
      galleryEl.innerHTML = seq.gallery.map((img) => `<img src="${img}" alt="Sequence Photo" />`).join("");
    } else {
      galleryEl.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">Photos are being updated. Please check back soon.</p>`;
    }
  }

  // Lecturers in this sequence
  const lecturersEl = document.getElementById("sequence-lecturers");
  if (lecturersEl) {
    const lecturerSlugs = await getLecturerSlugs();
    const lecturers = (await Promise.all(lecturerSlugs.map(fetchLecturer)))
      .filter(Boolean)
      .filter((l) => (l.sequence || "").toLowerCase() === slug);

    if (lecturers.length === 0) {
      lecturersEl.innerHTML = `<p style="text-align:center; width:100%; color:#666;">Lecturer information is being updated. Please check back soon.</p>`;
    } else {
      lecturersEl.innerHTML = lecturers.map((l) => `
        <div class="member">
          <img src="${l.photo}" alt="${l.name}" />
          <h3>${l.name}</h3>
          <p class="role">${l.role}</p>
        </div>
      `).join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderSequencePage();
});