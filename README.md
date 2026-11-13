<div align="center">

# Tahseen Raza Ansari — Developer Portfolio

**A portfolio you can pull, flip, and walk through.**
Physics-based UI, 3D interactions, and one door per skill, all in the browser.

[![GitHub](https://img.shields.io/badge/GitHub-tahseencode-181717?style=for-the-badge&logo=github)](https://github.com/tahseencode)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Tahseen%20Raza%20Ansari-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/tahseen-raza-ansari/)
[![Email](https://img.shields.io/badge/Email-tahseencode%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tahseencode@gmail.com)

[Live Demo](#) · [Features](#-features) · [Projects](#-featured-projects) · [Run Locally](#-run-locally)

<!-- Add a screenshot or GIF here, e.g. ![Preview](./assets/preview.gif) -->

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Featured Projects](#-featured-projects)
- [Tech Highlights](#-tech-highlights)
- [Run Locally](#-run-locally)
- [Deployment](#-deployment)
- [Customization](#-customization)
- [Contact](#-contact)
- [Credits](#-credits)

---

## 👋 About

This is the personal portfolio of **Tahseen Raza Ansari**, a B.Tech IT student who builds across full-stack web, computer vision, and machine learning. The design is inspired by [therishithakor.com](https://therishithakor.com/) and rebuilt from scratch with its own interactions, content, and visual language.

Instead of a flat list of projects, the site is a small world to explore: pull a cord to change the theme, flip through the hero calendar, open a door to enter a skill's room, and ride a time machine back through the timeline.

---

## 🌟 Features

### 🪢 Physical Pull-Cord Theme Switcher
- Verlet-integration rope hanging from the top-right corner, with gravity, spring tension, and drag.
- Mechanical click sound synthesized live with the Web Audio API (no audio files).
- Smooth crossfade between **Warm Bone** (light) and **Charcoal** (dark) using the View Transitions API.
- Theme choice persists across visits via `localStorage`.

### 📅 3D Mechanical Flip Calendar (Hero)
- Periodic 3D page flip with binder rings and realistic lighting.
- Cycles through core disciplines: *AI & ML Engineer*, *Full-Stack Developer*, *Computer Vision Dev*, *Systems Programmer*, *Creative Problem Solver*.

### 🃏 Interactive Holographic Ability Card
- 3D perspective tilt that follows the cursor or touch.
- Prismatic foil sheen and specular glare.
- Tap or click to flip between proficiency radar metrics and career achievements.

### 🚪 "My Work, One Door Per Skill"
- Four architectural doors with brass handles, fluted wood panels, and engraved plates.
- **Hover:** the door cracks open, a golden light pool spills onto the floor, and a live skill card appears.
- **Click:** the door opens and you walk into that discipline's full project showcase.

### ⏳ "Let's Go Back In Time"
- 3D rotating starfield tunnel rendered on canvas.
- A rolling 4-digit mechanical odometer that runs backward through the timeline: **2026 → 2025 → 2024 → Foundations**.

### ✉️ Project Request Drawer
- Service category pills, validated inputs, and direct mail dispatch to `tahseencode@gmail.com`.

---

## 🛠 Featured Projects

| Discipline | Projects |
|---|---|
| **Web & Full-Stack** | Zero-Token Sentinel (Cost Collapser) · MediKiosk / AyurKiosk (SIH26047) · PlanMyPaisa · Netflix Clone |
| **AI & Computer Vision** | AI Manga Translator (OCR + Inpainting) · Driver Drowsiness & Emotion Detector with Hardware Buzzer · AI Criminal Network Analysis System (SIH26189) |
| **Systems & C++** | HybridCalculator AST Engine · Competitive Programming & Low-Level Bug Triage |
| **Cloud & DevOps** | Multi-Cloud CI/CD & Docker · Dual SQL/NoSQL Persistence (MySQL + MongoDB) |

---

## ⚙️ Tech Highlights

| Area | What's used |
|---|---|
| Theming | CSS custom properties, View Transitions API, `localStorage` |
| Physics | Verlet integration for the pull-cord rope |
| Audio | Web Audio API (synthesized click, no assets) |
| 3D & motion | CSS 3D transforms, perspective tilt, canvas starfield |
| Rendering | Static site, no build step required |

---

## 🚀 Run Locally

No build step and no dependencies. Open `index.html` directly in a browser, or serve it locally:

```bash
# Clone the repository
git clone https://github.com/tahseencode/<your-repo-name>.git
cd <your-repo-name>

# Option 1: Python
python -m http.server 3000

# Option 2: Node.js
npx serve .
```

Then visit **http://localhost:3000**.

> **Tip:** Serving over `http://localhost` is recommended over opening the file directly, since some browser features behave better on a local server.

---

## ☁️ Deployment

Because the site is fully static, it deploys anywhere in seconds:

- **Vercel:** import the repo, framework preset `Other`, no build command.
- **GitHub Pages:** Settings → Pages → deploy from the `main` branch root.
- **Netlify:** drag and drop the folder or connect the repo.

---

## 🎨 Customization

- **Content:** edit the text for hero titles, project cards, and timeline milestones directly in `index.html`.
- **Colors:** adjust the light and dark palette values in the CSS custom properties near the top of the stylesheet.
- **Contact address:** replace the email in the contact modal's mail dispatch logic with your own.

---

## 📬 Contact

Have a project or an idea? Use the **Project Request** drawer on the site, or reach out directly:

- 📧 [tahseencode@gmail.com](mailto:tahseencode@gmail.com)
- 💼 [LinkedIn](https://www.linkedin.com/in/tahseen-raza-ansari/)
- 🐙 [GitHub](https://github.com/tahseencode)

---

## 🙌 Credits

Design inspiration: [therishithakor.com](https://therishithakor.com/). All code, content, and project work are by Tahseen Raza Ansari.

---

<div align="center">

⭐ If you like this portfolio, consider starring the repo.

</div>