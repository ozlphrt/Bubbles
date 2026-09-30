# 🫧 Bubbles

An ultra-responsive, physics-accurate interactive bubble puzzle game and real-time fluid simulation built with HTML5 Canvas, Web Audio API, and vanilla modern JavaScript.

## ✨ Features
- **3D Volumetric Bubble Rendering**: Rayleigh surface oscillation harmonics, contact flattening, specular highlights, and real-time customizable base colors and lighting.
- **Plateau Foam Dynamics**: Dynamic surface tension, Laplace pressure mechanics, and overburden weight cascading.
- **Synthesized Audio Engine**: Procedural Web Audio popping and resonant coalescence harmonics.
- **10 Progressive Challenge Levels**: Escalating color spectrum, tighter countdown timers, and target diameters.
- **In-Game Settings & Tuner**: Collapsible Color & Lighting visual adjustments, physics parameters, and level jumper.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation & Run Locally
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```
Open `http://localhost:5173` in your browser.

## 🌐 GitHub Pages Deployment
A ready-to-use GitHub Actions workflow is provided at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### How to deploy on GitHub Pages:
1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** &rarr; **Pages**.
3. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
4. Every push to `main` (or `master`) will automatically build and publish your game to `https://<username>.github.io/<repo-name>/`.

## 🕹️ Controls
- **Tap / Click**: Pop or interact with bubbles
- **Drag**: Attract, swirl, or burst depending on the selected tool in Settings
- **Top Right (⚙️)**: Open Settings & Levels Drawer (includes level selection, physics tuning, and collapsible Color Controls)
- **Spacebar**: Pause / Resume / Start Level
