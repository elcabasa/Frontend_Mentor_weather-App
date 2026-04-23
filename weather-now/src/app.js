// =============================================================
// Weather Now — vanilla JS app with full upgrades
// =============================================================

// ---------------- Constants ----------------
const LS = {
  unit: "wn-unit",
  theme: "wn-theme",
  themeMode: "wn-theme-mode", // "auto" | "manual"
  favs: "wn-favorites",
  recents: "wn-recents",
};
const DEFAULT_LOC = { name: "Lagos", country: "Nigeria", lat: 6.4541, lon: 3.3947 };

// ---------------- State ----------------
const state = {
  unit: localStorage.getItem(LS.unit) || "celsius",
  theme: localStorage.getItem(LS.theme) || "dark",
  themeMode: localStorage.getItem(LS.themeMode) || "manual",
  panels: { A: null, B: null }, // { loc, data }
  selectedDay: 0,
  compare: false,
  favorites: JSON.parse(localStorage.getItem(LS.favs) || "[]"),
  recents: JSON.parse(localStorage.getItem(LS.recents) || "[]"),
};

// ---------------- DOM ----------------
const $ = (id) => document.getElementById(id);
const els = {
  themeToggle: $("themeToggle"),
  compareToggle: $("compareToggle"),
  unitsBtn: $("unitsBtn"),
  unitsMenu: $("unitsMenu"),
  searchForm: $("searchForm"),
  searchInput: $("searchInput"),
  micBtn: $("micBtn"),
  suggestList: $("suggestList"),
  chipsRow: $("chipsRow"),
  dashboard: $("dashboard"),
  panelA: document.querySelector('.left-col[data-panel="A"]'),
  panelB: document.querySelector('.left-col[data-panel="B"]'),
  hourlyList: $("hourlyList"),
  dayBtn: $("dayBtn"),
  dayMenu: $("dayMenu"),
  dayLabel: $("dayLabel"),
  compareSection: $("compareSection"),
  compareForm: $("compareForm"),
  compareInput: $("compareInput"),
  compareClose: $("compareClose"),
  bgFx: $("bgFx"),
};

// ---------------- Weather Codes ----------------
const WEATHER = {
  0:  { icon: "☀️", label: "Clear", bg: "clear" },
  1:  { icon: "🌤️", label: "Mostly clear", bg: "clear" },
  2:  { icon: "⛅", label: "Partly cloudy", bg: "cloudy" },
  3:  { icon: "☁️", label: "Overcast", bg: "cloudy" },
  45: { icon: "🌫️", label: "Fog", bg: "fog" },
  48: { icon: "🌫️", label: "Rime fog", bg: "fog" },
  51: { icon: "🌦️", label: "Light drizzle", bg: "rain" },
  53: { icon: "🌦️", label: "Drizzle", bg: "rain" },
  55: { icon: "🌧️", label: "Heavy drizzle", bg: "rain" },
  56: { icon: "🌨️", label: "Freezing drizzle", bg: "rain" },
  57: { icon: "🌨️", label: "Freezing drizzle", bg: "rain" },
  61: { icon: "🌧️", label: "Light rain", bg: "rain" },
  63: { icon: "🌧️", label: "Rain", bg: "rain" },
  65: { icon: "🌧️", label: "Heavy rain", bg: "rain" },
  66: { icon: "🌨️", label: "Freezing rain", bg: "rain" },
  67: { icon: "🌨️", label: "Freezing rain", bg: "rain" },
  71: { icon: "🌨️", label: "Light snow", bg: "snow" },
  73: { icon: "❄️", label: "Snow", bg: "snow" },
  75: { icon: "❄️", label: "Heavy snow", bg: "snow" },
  77: { icon: "🌨️", label: "Snow grains", bg: "snow" },
  80: { icon: "🌦️", label: "Light showers", bg: "rain" },
  81: { icon: "🌧️", label: "Showers", bg: "rain" },
  82: { icon: "⛈️", label: "Heavy showers", bg: "rain" },
  85: { icon: "🌨️", label: "Snow showers", bg: "snow" },
  86: { icon: "❄️", label: "Heavy snow showers", bg: "snow" },
  95: { icon: "⛈️", label: "Thunderstorm", bg: "thunder" },
  96: { icon: "⛈️", label: "Thunderstorm w/ hail", bg: "thunder" },
  99: { icon: "⛈️", label: "Thunderstorm w/ hail", bg: "thunder" },
};
const wMeta = (code) => WEATHER[code] || { icon: "⛅", label: "—", bg: "cloudy" };

// ---------------- Helpers ----------------
const toUnit = (c) => state.unit === "fahrenheit" ? Math.round((c * 9) / 5 + 32) : Math.round(c);
const unitSym = () => state.unit === "fahrenheit" ? "°F" : "°";
const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const locKey = (loc) => `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}`;

function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ---------------- Theme ----------------
function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
  els.themeToggle.textContent = state.theme === "light" ? "☀️" : "🌙";
}

function autoThemeFromSun(sunriseISO, sunsetISO) {
  if (state.themeMode !== "auto" || !sunriseISO || !sunsetISO) return;
  const now = Date.now();
  const sr = new Date(sunriseISO).getTime();
  const ss = new Date(sunsetISO).getTime();
  const isDay = now >= sr && now < ss;
  const next = isDay ? "light" : "dark";
  if (next !== state.theme) {
    state.theme = next;
    localStorage.setItem(LS.theme, state.theme);
    applyTheme();
  }
}

els.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  state.themeMode = "manual";
  localStorage.setItem(LS.theme, state.theme);
  localStorage.setItem(LS.themeMode, "manual");
  applyTheme();
  updateUnitMenuActive();
});

// ---------------- Units / Mode menu ----------------
function updateUnitMenuActive() {
  els.unitsMenu.querySelectorAll(".unit-option").forEach((x) => {
    if (x.dataset.unit) x.classList.toggle("active", x.dataset.unit === state.unit);
    if (x.dataset.mode) x.classList.toggle("active", state.themeMode === "auto");
  });
}

els.unitsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  els.unitsMenu.classList.toggle("hidden");
  els.dayMenu.classList.add("hidden");
});

els.unitsMenu.querySelectorAll(".unit-option").forEach((b) => {
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    if (b.dataset.unit) {
      state.unit = b.dataset.unit;
      localStorage.setItem(LS.unit, state.unit);
      renderAll();
    } else if (b.dataset.mode === "auto") {
      state.themeMode = state.themeMode === "auto" ? "manual" : "auto";
      localStorage.setItem(LS.themeMode, state.themeMode);
      // Re-evaluate auto theme using current panel A's sun times
      const a = state.panels.A?.data;
      if (state.themeMode === "auto" && a) {
        autoThemeFromSun(a.daily?.sunrise?.[0], a.daily?.sunset?.[0]);
      }
    }
    updateUnitMenuActive();
  });
});

// ---------------- Day menu ----------------
els.dayBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  els.dayMenu.classList.toggle("hidden");
  els.unitsMenu.classList.add("hidden");
});

document.addEventListener("click", () => {
  els.unitsMenu.classList.add("hidden");
  els.dayMenu.classList.add("hidden");
  els.suggestList.classList.add("hidden");
});

// ---------------- Search & Suggestions ----------------
let suggestTimer = null;
els.searchInput.addEventListener("input", () => {
  const q = els.searchInput.value.trim();
  clearTimeout(suggestTimer);
  if (q.length < 2) { els.suggestList.classList.add("hidden"); return; }
  suggestTimer = setTimeout(() => fetchSuggestions(q), 250);
});
els.searchInput.addEventListener("click", (e) => e.stopPropagation());

async function fetchSuggestions(q) {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
    const j = await r.json();
    const results = j.results || [];
    if (!results.length) { els.suggestList.classList.add("hidden"); return; }
    els.suggestList.innerHTML = results.map((r) => `
      <li data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${escHtml(r.name)}" data-country="${escHtml(r.country || "")}">
        ${escHtml(r.name)}${r.admin1 ? ", " + escHtml(r.admin1) : ""}${r.country ? ", " + escHtml(r.country) : ""}
      </li>`).join("");
    els.suggestList.classList.remove("hidden");
    els.suggestList.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        loadPanel("A", { name: li.dataset.name, country: li.dataset.country, lat: parseFloat(li.dataset.lat), lon: parseFloat(li.dataset.lon) });
        els.searchInput.value = "";
        els.suggestList.classList.add("hidden");
      });
    });
  } catch (err) { console.error("geocode error", err); }
}

async function geocodeFirst(q) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);
  const j = await r.json();
  const top = j.results && j.results[0];
  if (!top) return null;
  return { name: top.name, country: top.country || "", lat: top.latitude, lon: top.longitude };
}

els.searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.searchInput.value.trim();
  if (!q) return;
  const loc = await geocodeFirst(q);
  if (loc) {
    loadPanel("A", loc);
    els.searchInput.value = "";
    els.suggestList.classList.add("hidden");
  }
});

// ---------------- Voice search (Web Speech API) ----------------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  els.micBtn.addEventListener("click", () => {
    try {
      els.micBtn.classList.add("listening");
      recognition.start();
    } catch (_) { els.micBtn.classList.remove("listening"); }
  });

  recognition.addEventListener("result", async (e) => {
    const t = e.results[0][0].transcript.replace(/[.?!]$/, "").trim();
    els.searchInput.value = t;
    const loc = await geocodeFirst(t);
    if (loc) loadPanel("A", loc);
  });
  recognition.addEventListener("end", () => els.micBtn.classList.remove("listening"));
  recognition.addEventListener("error", () => els.micBtn.classList.remove("listening"));
} else {
  els.micBtn.style.display = "none";
}

// ---------------- Compare mode ----------------
els.compareToggle.addEventListener("click", () => {
  state.compare = !state.compare;
  els.compareToggle.classList.toggle("active", state.compare);
  els.compareSection.classList.toggle("hidden", !state.compare);
  document.body.classList.toggle("compare-active", state.compare);
  if (state.compare && !state.panels.B) {
    els.compareInput.focus();
  }
});

els.compareClose.addEventListener("click", () => {
  state.compare = false;
  els.compareToggle.classList.remove("active");
  els.compareSection.classList.add("hidden");
  document.body.classList.remove("compare-active");
  state.panels.B = null;
  els.panelB.innerHTML = "";
});

els.compareForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.compareInput.value.trim();
  if (!q) return;
  const loc = await geocodeFirst(q);
  if (loc) {
    loadPanel("B", loc);
    els.compareInput.value = "";
  }
});

// ---------------- Favorites & Recents ----------------
function saveFavs() { localStorage.setItem(LS.favs, JSON.stringify(state.favorites)); }
function saveRecents() { localStorage.setItem(LS.recents, JSON.stringify(state.recents)); }

function isFavorite(loc) {
  return state.favorites.some((f) => locKey(f) === locKey(loc));
}

function toggleFavorite(loc) {
  const k = locKey(loc);
  const idx = state.favorites.findIndex((f) => locKey(f) === k);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(loc);
  saveFavs();
  renderChips();
  renderPanel("A");
}

function pushRecent(loc) {
  const k = locKey(loc);
  state.recents = state.recents.filter((r) => locKey(r) !== k);
  state.recents.unshift(loc);
  state.recents = state.recents.slice(0, 6);
  saveRecents();
  renderChips();
}

function renderChips() {
  const parts = [];
  if (state.favorites.length) {
    parts.push(`<span class="chip-label">★ Favorites:</span>`);
    state.favorites.forEach((f, i) => {
      parts.push(`<span class="chip" data-fav="${i}"><span class="star">★</span>${escHtml(f.name)}<button class="x" data-rm-fav="${i}" aria-label="Remove">✕</button></span>`);
    });
  }
  if (state.recents.length) {
    parts.push(`<span class="chip-label">Recent:</span>`);
    state.recents.forEach((r, i) => {
      parts.push(`<span class="chip" data-recent="${i}">${escHtml(r.name)}</span>`);
    });
  }
  els.chipsRow.innerHTML = parts.join("");

  els.chipsRow.querySelectorAll("[data-fav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-rm-fav]")) return;
      const i = parseInt(el.dataset.fav, 10);
      loadPanel("A", state.favorites[i]);
    });
  });
  els.chipsRow.querySelectorAll("[data-rm-fav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(el.dataset.rmFav, 10);
      state.favorites.splice(i, 1);
      saveFavs();
      renderChips();
      renderPanel("A");
    });
  });
  els.chipsRow.querySelectorAll("[data-recent]").forEach((el) => {
    el.addEventListener("click", () => {
      const i = parseInt(el.dataset.recent, 10);
      loadPanel("A", state.recents[i]);
    });
  });
}

// ---------------- Fetch ----------------
async function fetchWeather(loc) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,surface_pressure` +
    `&hourly=temperature_2m,weather_code,visibility,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max` +
    `&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  const j = await r.json();
  // Enrich current with values pulled from the matching hourly index
  if (j.current && j.hourly && j.hourly.time) {
    const curHour = j.current.time.slice(0, 13); // YYYY-MM-DDTHH
    let idx = j.hourly.time.findIndex((t) => t.slice(0, 13) === curHour);
    if (idx < 0) idx = 0;
    j.current.uv_index = j.hourly.uv_index?.[idx];
    j.current.visibility = j.hourly.visibility?.[idx];
  }
  return j;
}

async function loadPanel(which, loc) {
  document.body.classList.add("loading");
  try {
    const data = await fetchWeather(loc);
    state.panels[which] = { loc, data };
    if (which === "A") {
      pushRecent(loc);
      // auto theme on data load
      autoThemeFromSun(data.daily?.sunrise?.[0], data.daily?.sunset?.[0]);
      // dynamic background based on current weather
      applyDynamicBg(data.current?.weather_code);
    }
    renderAll();
  } catch (err) {
    console.error("weather fetch error", err);
  } finally {
    document.body.classList.remove("loading");
  }
}

// ---------------- Dynamic Backgrounds ----------------
function applyDynamicBg(code) {
  const fx = els.bgFx;
  const meta = wMeta(code);
  fx.className = "bg-fx " + meta.bg;
  fx.innerHTML = "";
  if (meta.bg === "rain") {
    for (let i = 0; i < 60; i++) {
      const d = document.createElement("div");
      d.className = "rain-drop";
      d.style.left = Math.random() * 100 + "vw";
      d.style.animationDuration = (0.6 + Math.random() * 0.7) + "s";
      d.style.animationDelay = (Math.random() * -2) + "s";
      d.style.opacity = 0.4 + Math.random() * 0.5;
      fx.appendChild(d);
    }
  } else if (meta.bg === "snow") {
    for (let i = 0; i < 40; i++) {
      const f = document.createElement("div");
      f.className = "snow-flake";
      f.style.left = Math.random() * 100 + "vw";
      f.style.animationDuration = (5 + Math.random() * 6) + "s";
      f.style.animationDelay = (Math.random() * -8) + "s";
      f.style.fontSize = (8 + Math.random() * 10) + "px";
      f.textContent = "❄";
      fx.appendChild(f);
    }
  }
}

// ---------------- Render ----------------
function renderAll() {
  renderPanel("A");
  if (state.compare && state.panels.B) renderPanel("B");
  renderHourlySidebar();
}

function renderPanel(which) {
  const p = state.panels[which];
  const target = which === "A" ? els.panelA : els.panelB;
  if (!p) { target.innerHTML = ""; return; }
  const { loc, data } = p;
  const cur = data.current || {};
  const daily = data.daily || {};
  const meta = wMeta(cur.weather_code);
  const cityLabel = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
  const now = cur.time ? new Date(cur.time) : new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  const fav = isFavorite(loc);

  // Sun arc progress
  const sr = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).getTime() : null;
  const ss = daily.sunset?.[0] ? new Date(daily.sunset[0]).getTime() : null;
  let sunPct = 0;
  if (sr && ss) {
    const t = Date.now();
    sunPct = Math.max(0, Math.min(1, (t - sr) / (ss - sr)));
  }
  const arcW = 100, arcH = 26;
  const arcX = sunPct * arcW;
  const arcY = arcH - Math.sin(sunPct * Math.PI) * arcH * 0.9;

  // Visibility (km)
  const visKm = cur.visibility != null ? Math.round(cur.visibility / 1000) : null;
  const visPct = visKm != null ? Math.min(100, (visKm / 20) * 100) : 0;

  // UV
  const uv = cur.uv_index != null ? Math.round(cur.uv_index * 10) / 10 : null;
  const uvPct = uv != null ? Math.min(100, (uv / 11) * 100) : 0;
  const uvLabel = uv == null ? "—" : uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very high" : "Extreme";

  // Pressure
  const pressure = cur.pressure_msl != null ? Math.round(cur.pressure_msl) : null;

  target.innerHTML = `
    <div class="main-card">
      <div class="main-card-bg"></div>
      <div class="main-card-content">
        <div class="city-block">
          <div class="fav-row">
            <h2>${escHtml(cityLabel)}</h2>
            <button class="fav-btn ${fav ? "active" : ""}" data-fav-toggle title="${fav ? "Remove from favorites" : "Add to favorites"}">${fav ? "★" : "☆"}</button>
          </div>
          <p>${escHtml(dateStr)}</p>
          <p class="condition-line">${meta.label}</p>
        </div>
        <div class="temp-block">
          <div class="weather-icon-lg">${meta.icon}</div>
          <div class="current-temp">${toUnit(cur.temperature_2m)}${unitSym()}</div>
        </div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Feels Like</span>
        <span class="metric-value">${toUnit(cur.apparent_temperature)}${unitSym()}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Humidity</span>
        <span class="metric-value">${Math.round(cur.relative_humidity_2m)}%</span>
        <div class="bar"><span style="width:${Math.round(cur.relative_humidity_2m)}%"></span></div>
      </div>
      <div class="metric-card">
        <span class="metric-label">Wind</span>
        <span class="metric-value">${cur.wind_speed_10m == null ? "--" : Math.round(cur.wind_speed_10m)} km/h</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Precipitation</span>
        <span class="metric-value">${cur.precipitation == null ? 0 : cur.precipitation} mm</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">☀ UV Index</span>
        <span class="metric-value">${uv == null ? "--" : uv}</span>
        <span class="metric-sub">${uvLabel}</span>
        <div class="bar uv"><span style="width:${uvPct}%"></span></div>
      </div>
      <div class="metric-card">
        <span class="metric-label">👁 Visibility</span>
        <span class="metric-value">${visKm == null ? "--" : visKm} km</span>
        <div class="bar"><span style="width:${visPct}%"></span></div>
      </div>
      <div class="metric-card">
        <span class="metric-label">⌬ Pressure</span>
        <span class="metric-value">${pressure == null ? "--" : pressure}</span>
        <span class="metric-sub">hPa</span>
      </div>
      <div class="metric-card sun-card">
        <span class="metric-label">🌅 Sunrise / 🌇 Sunset</span>
        <div class="sun-arc">
          <svg viewBox="0 0 100 26" preserveAspectRatio="none">
            <path class="arc-line" d="M0,26 Q50,-12 100,26" />
            <path class="arc-progress" d="M0,26 Q50,-12 100,26" stroke-dasharray="${sunPct * 130} 200" />
            <circle class="sun-dot" cx="${arcX}" cy="${arcY}" r="3" />
          </svg>
        </div>
        <div class="sun-times">
          <span>${sr ? fmtTime(daily.sunrise[0]) : "--"}</span>
          <span>${ss ? fmtTime(daily.sunset[0]) : "--"}</span>
        </div>
      </div>
    </div>

    <div class="daily-section">
      <h3 class="section-title">Daily forecast</h3>
      <div class="daily-grid">
        ${(daily.time || []).slice(0, 7).map((iso, i) => {
          const dt = new Date(iso + "T00:00:00");
          const dow = dt.toLocaleDateString("en-US", { weekday: "short" });
          return `
            <div class="day-card">
              <span class="dow">${dow}</span>
              <span class="icon">${wMeta(daily.weather_code[i]).icon}</span>
              <div class="hi-lo">
                <span class="hi">${toUnit(daily.temperature_2m_max[i])}${unitSym()}</span>
                <span class="lo">${toUnit(daily.temperature_2m_min[i])}${unitSym()}</span>
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>
  `;

  // Wire favorite toggle
  const favBtn = target.querySelector("[data-fav-toggle]");
  if (favBtn) favBtn.addEventListener("click", () => toggleFavorite(loc));
}

function renderHourlySidebar() {
  const p = state.panels.A;
  if (!p) return;
  const { data } = p;
  const daily = data.daily || {};
  const days = (daily.time || []).slice(0, 7);

  // Day menu
  els.dayMenu.innerHTML = days.map((iso, i) => {
    const date = new Date(iso + "T00:00:00");
    const label = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" });
    return `<button class="day-option ${i === state.selectedDay ? "active" : ""}" data-i="${i}">${label}</button>`;
  }).join("");
  els.dayMenu.querySelectorAll(".day-option").forEach((b) => {
    b.addEventListener("click", () => {
      state.selectedDay = parseInt(b.dataset.i, 10);
      els.dayMenu.classList.add("hidden");
      renderHourlySidebar();
    });
  });
  const selDate = days[state.selectedDay] ? new Date(days[state.selectedDay] + "T00:00:00") : new Date();
  els.dayLabel.textContent = state.selectedDay === 0 ? "Today" : selDate.toLocaleDateString("en-US", { weekday: "long" });

  // Hourly
  const hourly = data.hourly || {};
  const allTimes = hourly.time || [];
  const dayKey = days[state.selectedDay];
  let entries = [];
  for (let i = 0; i < allTimes.length; i++) {
    if (dayKey && allTimes[i].startsWith(dayKey)) {
      entries.push({ time: allTimes[i], temp: hourly.temperature_2m[i], code: hourly.weather_code[i] });
    }
  }
  if (state.selectedDay === 0) {
    const nowH = new Date().getHours();
    entries = entries.filter((e) => new Date(e.time).getHours() >= nowH);
  }
  entries = entries.slice(0, 10);

  els.hourlyList.innerHTML = entries.map((e) => {
    const dt = new Date(e.time);
    const hour = dt.getHours();
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? "AM" : "PM";
    return `
      <li class="hour-row">
        <div class="h-left">
          <span class="h-icon">${wMeta(e.code).icon}</span>
          <span class="h-time">${h12} ${ampm}</span>
        </div>
        <span class="h-temp">${toUnit(e.temp)}${unitSym()}</span>
      </li>`;
  }).join("");
}

// ---------------- Init ----------------
applyTheme();
updateUnitMenuActive();
renderChips();

function init() {
  if (!navigator.geolocation) { loadPanel("A", DEFAULT_LOC); return; }
  let resolved = false;
  const fallback = setTimeout(() => {
    if (!resolved) { resolved = true; loadPanel("A", DEFAULT_LOC); }
  }, 2500);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(fallback);
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&language=en&format=json`);
        const j = await r.json();
        const top = j.results && j.results[0];
        if (top) {
          loadPanel("A", { name: top.name, country: top.country || "", lat: pos.coords.latitude, lon: pos.coords.longitude });
          return;
        }
      } catch (_) {}
      loadPanel("A", { name: "Your location", country: "", lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(fallback);
      loadPanel("A", DEFAULT_LOC);
    },
    { timeout: 2000 },
  );
}

init();

// Re-evaluate auto theme every 5 minutes
setInterval(() => {
  const a = state.panels.A?.data;
  if (a) autoThemeFromSun(a.daily?.sunrise?.[0], a.daily?.sunset?.[0]);
}, 5 * 60 * 1000);

// ---------------- PWA — Service Worker ----------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}
