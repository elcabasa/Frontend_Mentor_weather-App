Weather Now
A sleek, glassmorphic weather dashboard built with vanilla HTML, CSS, and JavaScript. No frameworks or build steps required.

🚀 Quick Start
Weather Now is a static app. To use the PWA and Service Worker features, serve it via http:// (e.g., VS Code Live Server).

✨ Key Features
Live Data: Powered by Open-Meteo (No API key needed).

Smart Search: Autocomplete, Voice Search, and Geolocation (defaults to Lagos, Nigeria).

Dynamic UI: Backgrounds and themes (Light/Dark) that adapt to current weather and time of day.

Deep Metrics: UV Index, Sunrise/Sunset arcs, Visibility, and Pressure.

Compare Mode: Side-by-side weather comparison for two cities.

Persistence: Favorites and recent searches saved to localStorage.

PWA Ready: Installable on mobile/desktop with offline support via Service Workers.

📁 Structure
index.html: Main structure.

src/app.js: Logic (API, Voice, PWA, Favorites).

src/app.css: Glassmorphic styling and animations.

sw.js & manifest.webmanifest: PWA & Offline capabilities.
