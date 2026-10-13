/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/contact.js
   Purpose: Auto-load contact info from content/contact/
   ============================================ */

const GITHUB_REPO = "sammyoretan123-bit/masscomm-website";
const CONTACT_FOLDER = "content/contact";

async function getContactSlug() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${CONTACT_FOLDER}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("GitHub API failed");
    const files = await res.json();
    const mdFile = files.find((f) => f.name.endsWith(".md") && f.name !== ".gitkeep");
    return mdFile ? mdFile.name.replace(".md", "") : null;
  } catch (err) {
    console.warn("Could not fetch contact:", err);
    return null;
  }
}

function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };
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

async function fetchContact(slug) {
  try {
    const res = await fetch(`content/contact/${slug}.md`);
    if (!res.ok) throw new Error("Not found");
    const text = await res.text();
    const { data } = parseFrontMatter(text);
    return data;
  } catch (err) {
    console.warn("Could not load contact:", err);
    return null;
  }
}

async function renderContact() {
  const container = document.getElementById("contact-info");
  if (!container) return;

  const slug = await getContactSlug();
  if (!slug) {
    container.innerHTML = `<p style="color:#666; text-align:center; width:100%;">Contact information is being updated.</p>`;
    return;
  }

  const c = await fetchContact(slug);
  if (!c) return;

  const socialLines = [];
  if (c.instagram) socialLines.push(`Instagram: ${c.instagram}`);
  if (c.twitter) socialLines.push(`X (Twitter): ${c.twitter}`);
  if (c.facebook) socialLines.push(`Facebook: ${c.facebook}`);
  if (c.tiktok) socialLines.push(`TikTok: ${c.tiktok}`);

  container.innerHTML = `
    <div class="member">
      <h3>Department Address</h3>
      <p class="role">Location</p>
      <p>${(c.address || "").replace(/\n/g, "<br />")}</p>
    </div>
    <div class="member">
      <h3>Email</h3>
      <p class="role">Reach Out</p>
      <p>${c.email || ""}</p>
    </div>
    <div class="member">
      <h3>Phone</h3>
      <p class="role">Call Us</p>
      <p>${c.phone || ""}</p>
    </div>
    <div class="member">
      <h3>Social Media</h3>
      <p class="role">Follow Us</p>
      <p>${socialLines.join("<br />") || "Coming soon"}</p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderContact();
});