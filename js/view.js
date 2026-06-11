// DOM Elements
const displayDay = document.getElementById('display-day');
const cardsGrid = document.getElementById('cards-grid');

const viewBackBtn = document.getElementById('view-back-btn');
const backToHomeLogo = document.getElementById('back-to-home-logo');
const shareUrlBtn = document.getElementById('share-url-btn');

const themeSwitch = document.getElementById('theme-switch');
const themeText = document.getElementById('theme-text');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

let activeSchedule = [];

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('whatprogramstoday_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeSwitchUI(savedTheme);
}

function updateThemeSwitchUI(theme) {
  if (theme === 'dark') {
    themeSwitch.setAttribute('aria-checked', 'true');
    themeText.textContent = 'Dark Mode';
  } else {
    themeSwitch.setAttribute('aria-checked', 'false');
    themeText.textContent = 'Light Mode';
  }
}

themeSwitch.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('whatprogramstoday_theme', newTheme);
  updateThemeSwitchUI(newTheme);
  showToast(`Switched to ${newTheme} theme`, 'info');
});

// Toast Helper
function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toastNotification.className = 'toast show';
  
  const icon = document.getElementById('toast-icon');
  if (type === 'error') {
    icon.setAttribute('data-lucide', 'alert-circle');
    toastNotification.style.borderLeft = '4px solid var(--danger-color)';
  } else {
    icon.setAttribute('data-lucide', 'info');
    toastNotification.style.borderLeft = 'none';
  }
  lucide.createIcons();
  
  setTimeout(() => {
    toastNotification.className = 'toast';
  }, 3000);
}

// Navigation Helper
function navigateToHome() {
  if (window.location.protocol === 'file:') {
    window.location.href = 'index.html';
  } else {
    window.location.href = '/';
  }
}

viewBackBtn.addEventListener('click', navigateToHome);
backToHomeLogo.addEventListener('click', (e) => {
  e.preventDefault();
  navigateToHome();
});

// Returns today's date string in YYYY-MM-DD format using Sydney/Melbourne timezone
function getSydneyDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

// Timezone clock for Sydney/Melbourne
function updateLocalTime() {
  const now = new Date();
  
  // Day name in Sydney
  const dayOptions = {
    timeZone: 'Australia/Sydney',
    weekday: 'long'
  };
  const dayName = new Intl.DateTimeFormat('en-US', dayOptions).format(now);
  displayDay.textContent = `Today is ${dayName}`;
}

// Group programs by school and render cards
function processAndRenderSchedule() {
  cardsGrid.innerHTML = '';

  if (activeSchedule.length === 0) {
    renderEmptyState();
    return;
  }

  // Grouping logic: multiple programs for the same school are grouped in one card
  const groupedBySchool = {};
  activeSchedule.forEach(entry => {
    const school = entry.school.trim();
    const program = entry.program.trim();

    if (!groupedBySchool[school]) {
      groupedBySchool[school] = [];
    }
    
    // Add program if not already present in the school's list to avoid duplicates
    if (!groupedBySchool[school].includes(program)) {
      groupedBySchool[school].push(program);
    }
  });

  // Render cards for each school group
  Object.keys(groupedBySchool).forEach(schoolName => {
    const programs = groupedBySchool[schoolName];
    
    const card = document.createElement('div');
    card.className = 'program-card';

    const programLinesHTML = programs.map(p => `<div class="program-name-text">${p}</div>`).join('');

    card.innerHTML = `
      <div class="card-top">
        <div class="program-label">${programs.length > 1 ? 'Programs' : 'Program'}</div>
        ${programLinesHTML}
      </div>
      <div class="card-bottom">
        <div class="school-label">School</div>
        <div class="school-name-text">${schoolName}</div>
      </div>
    `;

    cardsGrid.appendChild(card);
  });
}

function renderEmptyState() {
  cardsGrid.innerHTML = `
    <div class="empty-state">
      <i data-lucide="calendar-x2" style="width: 3.5rem; height: 3.5rem; color: var(--text-muted);"></i>
      <h3 class="empty-title">No Program Schedule Found</h3>
      <p class="empty-subtitle">Create today's schedule and publish it to display cards on this screen.</p>
      <button class="btn btn-primary" onclick="navigateToHome()" style="width: auto;">
        <i data-lucide="plus-circle"></i>
        Build Schedule
      </button>
    </div>
  `;
  lucide.createIcons();
}

// Copy the view URL — anyone with this link sees the live schedule from the server
shareUrlBtn.addEventListener('click', () => {
  if (activeSchedule.length === 0) {
    showToast("Nothing to share! Build a schedule first.", "error");
    return;
  }

  const shareUrl = `${window.location.origin}/view`;

  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("View link copied to clipboard!");
  }).catch(() => {
    showToast("Could not copy link. Manually copy the address bar.", "error");
  });
});

// Load today's schedule from the Supabase-backed API
async function loadFromAPI() {
  try {
    const response = await fetch('/api/schedule');
    if (!response.ok) throw new Error(`API responded ${response.status}`);
    const data = await response.json();
    activeSchedule = data.entries || [];
  } catch (error) {
    console.error('Failed to load schedule from API:', error);
    activeSchedule = [];
    showToast("Could not load schedule from server.", "error");
  }
}

// App initialization
async function init() {
  initTheme();
  
  // 1. Set local day in Sydney/Melbourne timezone
  updateLocalTime();

  // 2. Load schedule data
  const urlParams = new URLSearchParams(window.location.search);
  const shareData = urlParams.get('s');

  if (shareData) {
    // Decode a legacy encoded share parameter
    try {
      const jsonString = decodeURIComponent(atob(shareData));
      activeSchedule = JSON.parse(jsonString);
      showToast("Loaded shared schedule!");
    } catch (e) {
      console.error('Failed to parse shared URL schedule data:', e);
      showToast("Shared link was invalid. Loading saved schedule instead.", "error");
      await loadFromAPI();
    }
  } else {
    await loadFromAPI();
  }

  // 3. Render grouped cards
  processAndRenderSchedule();
}

// Expose navigateToHome globally for empty state button
window.navigateToHome = navigateToHome;

document.addEventListener('DOMContentLoaded', init);
