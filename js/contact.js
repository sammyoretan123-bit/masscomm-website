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
    return mdFile ? mdFile.name : null; 
  } catch (err) {
    console.warn("Could not fetch contact file list:", err);
    return null;
  }
}

// A simpler parser that just looks for key: value pairs
function parseSimpleFrontMatter(text) {
  const data = {};
  // Remove the --- lines
  const cleanText = text.replace(/^---\s*|\s*---\s*$/g, '');
  
  cleanText.split('\n').forEach(line => {
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value !== '') {
        data[key] = value;
      }
    }
  });
  return data;
}

async function fetchContact(filename) {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${CONTACT_FOLDER}/${filename}`;
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error("File not found");
    const text = await res.text();
    return parseSimpleFrontMatter(text);
  } catch (err) {
    console.warn("Could not load contact details:", err);
    return null;
  }
}

async function renderContact() {
  const container = document.getElementById("contact-info");
  if (!container) return;

  const filename = await getContactSlug();
  if (!filename) {
    container.innerHTML = `<p style="color:#666; text-align:center; width:100%;">Contact information is being updated.</p>`;
    return;
  }

  const c = await fetchContact(filename);
  if (!c) {
    container.innerHTML = `<p style="color:#666; text-align:center; width:100%;">Could not load contact information.</p>`;
    return;
  }

  const socialLines = [];
  if (c.instagram) socialLines.push(`Instagram: ${c.instagram}`);
  if (c.twitter) socialLines.push(`X (Twitter): ${c.twitter}`);
  if (c.facebook) {
    const fbLink = c.facebook.startsWith('http') ? c.facebook : 'https://' + c.facebook;
    socialLines.push(`Facebook: <a href="${fbLink}" target="_blank" style="color:#6a0dad;">${c.facebook}</a>`);
  }
  if (c.tiktok) socialLines.push(`TikTok: ${c.tiktok}`);

  container.innerHTML = `
    <div class="member">
      <h3>Department Address</h3>
      <p class="role">Location</p>
      <p>${c.address || "Not provided"}</p>
    </div>
    <div class="member">
      <h3>Email</h3>
      <p class="role">Reach Out</p>
      <p><a href="mailto:${c.email || ''}" style="color:#6a0dad;">${c.email || "Not provided"}</a></p>
    </div>
    <div class="member">
      <h3>Phone</h3>
      <p class="role">Call Us</p>
      <p>${c.phone || "Not provided"}</p>
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