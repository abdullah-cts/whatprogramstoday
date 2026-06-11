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

// Copy sharing URL with encoded state
shareUrlBtn.addEventListener('click', () => {
  if (activeSchedule.length === 0) {
    showToast("Nothing to share! Build a schedule first.", "error");
    return;
  }

  try {
    const jsonString = JSON.stringify(activeSchedule);
    const base64Encoded = btoa(encodeURIComponent(jsonString));
    
    // Construct the URL with query parameter `s`
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${base64Encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("Shareable link copied to clipboard!");
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showToast("Could not copy link. Manually copy the address bar.", "error");
    });
  } catch (error) {
    console.error('Encoding error: ', error);
    showToast("Error creating shareable link.", "error");
  }
});

// App initialization
function init() {
  initTheme();
  
  // 1. Set local day in Sydney/Melbourne timezone
  updateLocalTime();

  // 2. Load schedule data
  const urlParams = new URLSearchParams(window.location.search);
  const shareData = urlParams.get('s');

  if (shareData) {
    try {
      // Decode share parameter
      const jsonString = decodeURIComponent(atob(shareData));
      activeSchedule = JSON.parse(jsonString);
      
      // Cache in localStorage as backup
      localStorage.setItem('whatprogramstoday_schedule', jsonString);
      
      showToast("Loaded shared schedule!");
    } catch (e) {
      console.error('Failed to parse shared URL schedule data:', e);
      showToast("Shared link was invalid. Loading saved schedule instead.", "error");
      loadFromLocalStorage();
    }
  } else {
    loadFromLocalStorage();
  }

  // 3. Render grouped cards
  processAndRenderSchedule();
}

function loadFromLocalStorage() {
  const savedDate = localStorage.getItem('whatprogramstoday_date');
  const todayDate = getSydneyDateString();

  // If stored date doesn't match today (Sydney time), it's stale — clear it
  if (savedDate && savedDate !== todayDate) {
    localStorage.removeItem('whatprogramstoday_schedule');
    localStorage.removeItem('whatprogramstoday_date');
    activeSchedule = [];
    return;
  }

  const savedSchedule = localStorage.getItem('whatprogramstoday_schedule');
  if (savedSchedule) {
    try {
      activeSchedule = JSON.parse(savedSchedule);
    } catch (e) {
      activeSchedule = [];
    }
  } else {
    activeSchedule = [];
  }
}

// Expose navigateToHome globally for empty state button
window.navigateToHome = navigateToHome;

document.addEventListener('DOMContentLoaded', init);
