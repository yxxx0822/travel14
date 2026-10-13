/* ================================================================
   旅游时光手账 — app.js
   Backend: http://localhost:8001/api
   ================================================================ */

const BASE = 'http://localhost:8001';

// ── State ────────────────────────────────────────────────────────
let currentUser = null;
let token = localStorage.getItem('token') || null;
let allDiaries = [];           // cache for my-diaries list
let currentSection = 'home';   // active section inside the shell
let discoverTab = 'latest';

// ── Bootstrap ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if (token) {
    const ok = await loadCurrentUser();
    if (ok) {
      enterShell();
    } else {
      token = null;
      localStorage.removeItem('token');
      showPage('page-login');
    }
  } else {
    showPage('page-login');
  }
});

// ── Auth helpers ─────────────────────────────────────────────────
async function apiRequest(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.detail || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

async function loadCurrentUser() {
  try {
    currentUser = await apiRequest('GET', '/api/auth/me');
    return true;
  } catch {
    return false;
  }
}

// ── Page routing ─────────────────────────────────────────────────
function showPage(pageId) {
  // Full-screen pages (auth)
  document.querySelectorAll('body > .page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

function enterShell() {
  // Hide auth pages, show shell
  document.querySelectorAll('body > .page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  const shell = document.getElementById('app-shell');
  shell.style.display = '';

  // Populate sidebar
  if (currentUser) {
    document.getElementById('sidebar-username').textContent = currentUser.username;
    const av = document.getElementById('sidebar-avatar');
    if (currentUser.avatarUrl) {
      av.style.backgroundImage = `url(${currentUser.avatarUrl})`;
      av.textContent = '';
    } else {
      av.textContent = (currentUser.username || '?')[0].toUpperCase();
    }
  }

  navigateTo('home');
}

function navigateTo(section) {
  currentSection = section;

  // Deactivate all inner pages
  document.querySelectorAll('#main-content .page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${section}`);
  if (page) page.classList.add('active');

  // Update nav highlight
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${section}`);
  if (navEl) navEl.classList.add('active');

  // Update topbar title
  const titles = {
    home: '首页', diaries: '我的日记', write: '写日记',
    map: '旅行地图', discover: '发现'
  };
  document.getElementById('topbar-title').textContent = titles[section] || '';

  // Lazy-load data per section
  if (section === 'home') loadHome();
  if (section === 'diaries') loadDiaries();
  if (section === 'discover') loadDiscover(discoverTab);
  if (section === 'map') {
    setTimeout(() => {
      initMap();
      if (leafletMap) leafletMap.invalidateSize();
    }, 150);
  }

  // Reset write form when navigating to it
  if (section === 'write') resetWriteForm();
}

// ── AUTH ─────────────────────────────────────────────────────────
async function login(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await apiRequest('POST', '/api/auth/login', { username, password }, false);
    token = data.access_token;
    localStorage.setItem('token', token);
    const ok = await loadCurrentUser();
    if (ok) {
      enterShell();
    } else {
      showToast('登录成功但获取用户信息失败，请重试', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function register(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const body = { username, password };
  if (email) body.email = email;
  try {
    await apiRequest('POST', '/api/auth/register', body, false);
    showToast('注册成功，请登录', 'success');
    // Pre-fill login
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = '';
    showPage('page-login');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  token = null;
  currentUser = null;
  allDiaries = [];
  localStorage.removeItem('token');
  // Restore auth page visibility
  document.getElementById('app-shell').style.display = 'none';
  document.querySelectorAll('body > .page').forEach(p => {
    p.style.display = '';
    p.classList.remove('active');
  });
  showPage('page-login');
}

// ── HOME ─────────────────────────────────────────────────────────
async function loadHome() {
  if (currentUser) {
    document.getElementById('welcome-greeting').textContent =
      `欢迎回来，${currentUser.username} 👋`;
  }

  try {
    const resp = await apiRequest('GET', '/api/diaries/');
    allDiaries = (resp?.diaries ?? resp) || [];
    renderHomeFeed(allDiaries.slice(0, 5));
    updateStats(allDiaries);
  } catch (err) {
    document.getElementById('home-diary-feed').innerHTML =
      `<div class="empty-state"><div>暂无日记</div></div>`;
  }
}

function renderHomeFeed(diaries) {
  const feed = document.getElementById('home-diary-feed');
  if (!diaries.length) {
    feed.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✈️</div>
      <div class="empty-title">还没有旅行记录</div>
      <div class="empty-desc">写下第一篇日记，开始你的旅行手账</div>
      <button class="btn btn-primary" onclick="navigateTo('write')">写日记</button>
    </div>`;
    return;
  }
  feed.innerHTML = diaries.map(d => diaryFeedCard(d)).join('');
}

function diaryFeedCard(d) {
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('zh-CN') : '';
  const location = d.location?.name || d.locationName || '';
  const preview = (d.content || '').slice(0, 80) + ((d.content || '').length > 80 ? '…' : '');
  return `<div class="feed-card" onclick="openDiaryDetail(${JSON.stringify(JSON.stringify(d))})" style="cursor:pointer;">
    <div class="feed-card-meta">
      <span class="feed-date">${date}</span>
      ${location ? `<span class="feed-location">📍 ${location}</span>` : ''}
    </div>
    <div class="feed-title">${escHtml(d.title || '（无标题）')}</div>
    <div class="feed-preview">${escHtml(preview)}</div>
  </div>`;
}

function updateStats(diaries) {
  const total = diaries.length;
  const pub = diaries.filter(d => d.visibility === 'PUBLIC').length;
  const places = new Set(diaries.map(d => d.location?.name || d.locationName).filter(Boolean)).size;
  const days = new Set(diaries.map(d => d.createdAt?.slice(0, 10)).filter(Boolean)).size;

  document.getElementById('stat-diaries').textContent = total;
  document.getElementById('stat-places').textContent = places;
  document.getElementById('stat2-diaries').textContent = total;
  document.getElementById('stat2-public').textContent = pub;
  document.getElementById('stat2-places').textContent = places;
  document.getElementById('stat2-days').textContent = days;
}

// ── MY DIARIES ────────────────────────────────────────────────────
async function loadDiaries() {
  document.getElementById('diaries-grid').innerHTML =
    '<div style="color:var(--n-4);font-size:var(--text-sm)">加载中…</div>';
  try {
    const resp = await apiRequest('GET', '/api/diaries/');
    allDiaries = (resp?.diaries ?? resp) || [];
    renderDiariesGrid(allDiaries);
  } catch (err) {
    document.getElementById('diaries-grid').innerHTML =
      `<div class="empty-state"><div class="empty-icon">😞</div><div>${escHtml(err.message)}</div></div>`;
  }
}

function filterDiaries() {
  const q = (document.getElementById('diary-search').value || '').toLowerCase();
  const vis = document.getElementById('diary-filter-vis').value;
  let list = allDiaries;
  if (q) list = list.filter(d =>
    (d.title || '').toLowerCase().includes(q) ||
    (d.location?.name || d.locationName || '').toLowerCase().includes(q)
  );
  if (vis) list = list.filter(d => d.visibility === vis);
  renderDiariesGrid(list);
}

function renderDiariesGrid(diaries) {
  const grid = document.getElementById('diaries-grid');
  if (!diaries.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📖</div>
      <div class="empty-title">没有找到日记</div>
      <div class="empty-desc">换个关键词试试，或者去写一篇新日记</div>
      <button class="btn btn-primary" onclick="navigateTo('write')">写日记</button>
    </div>`;
    return;
  }
  grid.innerHTML = diaries.map(d => diaryCard(d)).join('');
}

function diaryCard(d) {
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('zh-CN') : '';
  const location = d.location?.name || d.locationName || '';
  const preview = (d.content || '').slice(0, 100) + ((d.content || '').length > 100 ? '…' : '');
  const visIcon = { PUBLIC: '🌐', PRIVATE: '🔒', FRIENDS_ONLY: '👥' }[d.visibility] || '';
  const moods = d.moodTags || [];
  return `<div class="diary-card" onclick="openDiaryDetail(${JSON.stringify(JSON.stringify(d))})" style="cursor:pointer;">
    <div class="diary-card-header">
      <div class="diary-card-title">${escHtml(d.title || '（无标题）')}</div>
      <span class="vis-badge">${visIcon}</span>
    </div>
    <div class="diary-card-body">${escHtml(preview)}</div>
    <div class="diary-card-footer">
      <span>${date}${location ? ` · 📍 ${escHtml(location)}` : ''}</span>
      <div class="mood-tags">${moods.slice(0, 3).map(t => `<span class="mood-tag">${escHtml(t)}</span>`).join('')}</div>
    </div>
  </div>`;
}

function openDiaryDetail(dJson) {
  const d = JSON.parse(dJson);
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('zh-CN') : '';
  const travelDate = d.travelDate ? new Date(d.travelDate).toLocaleDateString('zh-CN') : '';
  const location = d.location?.name || d.locationName || '';
  const visLabel = { PUBLIC: '🌐 公开', PRIVATE: '🔒 仅自己', FRIENDS_ONLY: '👥 仅好友' }[d.visibility] || '';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:var(--sp-6)';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:var(--radius-lg);max-width:600px;width:100%;max-height:80vh;overflow-y:auto;padding:var(--sp-6);box-shadow:0 8px 32px rgba(0,0,0,.2);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--sp-4);">
      <h2 style="font-size:var(--text-xl);font-weight:700;color:var(--n-9);margin:0">${escHtml(d.title || '（无标题）')}</h2>
      <button onclick="this.closest('[style]').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--n-4);line-height:1;">×</button>
    </div>
    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-4);font-size:var(--text-sm);color:var(--n-5);">
      ${travelDate ? `<span>✈️ 旅行日期：${travelDate}</span>` : ''}
      ${location ? `<span>📍 ${escHtml(location)}</span>` : ''}
      <span>${visLabel}</span>
      <span>📅 发布于 ${date}</span>
    </div>
    <div style="font-size:var(--text-base);color:var(--n-8);line-height:1.8;white-space:pre-wrap;">${escHtml(d.content || '（无内容）')}</div>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── WRITE DIARY ───────────────────────────────────────────────────
function resetWriteForm() {
  document.getElementById('form-write').reset();
  updatePreview();
}

function updatePreview() {
  const title = document.getElementById('w-title').value || '日记标题';
  const content = document.getElementById('w-content').value || '在这里写下你的旅行故事…';
  const loc = document.getElementById('w-location-name').value || '未填写地点';
  document.getElementById('preview-title').textContent = title;
  document.getElementById('preview-text').textContent = content.slice(0, 200);
  document.getElementById('preview-location').textContent = `📍 ${loc}`;
}

async function createDiary(e) {
  e.preventDefault();
  const title = document.getElementById('w-title').value.trim();
  const content = document.getElementById('w-content').value.trim();
  const locationName = document.getElementById('w-location-name').value.trim();
  const visibility = document.getElementById('w-visibility').value;
  const lat = parseFloat(document.getElementById('w-lat').value);
  const lng = parseFloat(document.getElementById('w-lng').value);
  const address = document.getElementById('w-address').value.trim();
  const moodRaw = document.getElementById('w-mood').value;
  const moodTags = moodRaw.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const travelDateRaw = document.getElementById('w-travel-date').value;
  // Convert date string "YYYY-MM-DD" to ISO datetime for backend
  const travelDate = travelDateRaw ? new Date(travelDateRaw).toISOString() : new Date().toISOString();

  const body = {
    title, content, visibility,
    travelDate,
    mood: moodTags.join(',') || undefined,
    location: { name: locationName, latitude: isNaN(lat) ? 0 : lat, longitude: isNaN(lng) ? 0 : lng, address: address || undefined }
  };

  try {
    await apiRequest('POST', '/api/diaries/', body);
    showToast('日记已发布', 'success');
    allDiaries = [];       // invalidate cache
    navigateTo('diaries');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── MAP ───────────────────────────────────────────────────────────
let leafletMap = null;
let diaryMarkers = [];

function initMap() {
  if (leafletMap) return; // already initialized
  leafletMap = L.map('leaflet-map').setView([35.0, 105.0], 4);
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    attribution: '© 高德地图',
    subdomains: '1234',
    maxZoom: 18
  }).addTo(leafletMap);
  // Load diary pins after map is ready
  loadMapPins();
}

async function loadMapPins() {
  try {
    const diaries = allDiaries.length ? allDiaries : await apiRequest('GET', '/api/diaries/');
    if (!allDiaries.length) allDiaries = diaries || [];
    renderNearbyList(diaries || []);
    // Add a marker for each diary with valid lat/lng
    diaryMarkers.forEach(m => m.remove());
    diaryMarkers = [];
    (diaries || []).forEach(d => {
      const lat = d.location?.latitude ?? d.latitude;
      const lng = d.location?.longitude ?? d.longitude;
      if (!lat || !lng) return;
      const marker = L.marker([lat, lng]).addTo(leafletMap);
      const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('zh-CN') : '';
      marker.bindPopup(`<strong>${escHtml(d.title || '（无标题）')}</strong><br>${date}`);
      diaryMarkers.push(marker);
    });
  } catch {
    // silently ignore — map still usable
  }
}

function requestLocation() {
  if (!navigator.geolocation) {
    showToast('浏览器不支持地理定位', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    if (leafletMap) {
      leafletMap.setView([lat, lng], 10);
      L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: '<div style="width:14px;height:14px;background:#7a9e78;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize: [14,14], iconAnchor:[7,7] })
      }).addTo(leafletMap).bindPopup('你在这里').openPopup();
    }
    // Pre-fill write form coordinates
    document.getElementById('w-lat').value = lat.toFixed(6);
    document.getElementById('w-lng').value = lng.toFixed(6);
    showToast('定位成功', 'success');
  }, () => {
    showToast('定位失败，请检查浏览器权限', 'error');
  });
}

function renderNearbyList(diaries) {
  const list = document.getElementById('nearby-list');
  if (!diaries.length) {
    list.innerHTML = '<div style="color:var(--n-4);font-size:var(--text-sm);text-align:center">附近暂无公开日记</div>';
    return;
  }
  list.innerHTML = diaries.slice(0, 8).map(d => {
    const loc = d.location?.name || d.locationName || '';
    return `<div class="nearby-item">
      <div class="nearby-title">${escHtml(d.title || '（无标题）')}</div>
      ${loc ? `<div class="nearby-loc">📍 ${escHtml(loc)}</div>` : ''}
    </div>`;
  }).join('');
}

// ── DISCOVER ─────────────────────────────────────────────────────
function switchDiscoverTab(tab, el) {
  discoverTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  loadDiscover(tab);
}

async function loadDiscover(tab) {
  const grid = document.getElementById('discover-grid');
  grid.innerHTML = '<div style="color:var(--n-4);font-size:var(--text-sm)">加载中…</div>';

  try {
    let diaries = [];
    if (tab === 'latest' || tab === 'nearby') {
      // Try public endpoint
      diaries = await apiRequest('GET', '/api/diaries/public?limit=20');
    } else if (tab === 'following') {
      diaries = await apiRequest('GET', '/api/diaries/following?limit=20');
    }
    renderDiscoverGrid(diaries || []);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">暂无内容</div>
      <div class="empty-desc">${escHtml(err.message)}</div>
    </div>`;
  }
}

function renderDiscoverGrid(diaries) {
  const grid = document.getElementById('discover-grid');
  if (!diaries.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🌍</div>
      <div class="empty-title">还没有公开日记</div>
      <div class="empty-desc">成为第一个分享旅行故事的人</div>
    </div>`;
    return;
  }
  grid.innerHTML = diaries.map(d => discoverCard(d)).join('');
}

function discoverCard(d) {
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('zh-CN') : '';
  const loc = d.location?.name || d.locationName || '';
  const author = d.author?.username || d.authorUsername || '';
  const preview = (d.content || '').slice(0, 90) + ((d.content || '').length > 90 ? '…' : '');
  return `<div class="discover-card" onclick="openDiaryDetail(${JSON.stringify(JSON.stringify(d))})" style="cursor:pointer;">
    <div class="dc-header">
      <div class="dc-avatar">${(author || '?')[0].toUpperCase()}</div>
      <div>
        <div class="dc-author">${escHtml(author)}</div>
        <div class="dc-date">${date}</div>
      </div>
    </div>
    <div class="dc-title">${escHtml(d.title || '（无标题）')}</div>
    <div class="dc-body">${escHtml(preview)}</div>
    ${loc ? `<div class="dc-location">📍 ${escHtml(loc)}</div>` : ''}
  </div>`;
}

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── UTILS ─────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
