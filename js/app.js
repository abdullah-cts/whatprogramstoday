// Global variables for lists
let schoolsList = [];
let programsList = [];
let currentSchedule = [];

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const creatorScreen = document.getElementById('creator-screen');
const goToCreateBtn = document.getElementById('go-to-create-btn');
const goToViewBtn = document.getElementById('go-to-view-btn');
const formBackBtn = document.getElementById('form-back-btn');
const logoLink = document.getElementById('logo-link');

const schoolCombobox = document.getElementById('school-combobox');
const schoolInput = document.getElementById('school-input');
const schoolDropdown = document.getElementById('school-dropdown');

const programCombobox = document.getElementById('program-combobox');
const programInput = document.getElementById('program-input');
const programDropdown = document.getElementById('program-dropdown');

const addMoreBtn = document.getElementById('add-more-btn');
const submitScheduleBtn = document.getElementById('submit-schedule-btn');

const addedItemsList = document.getElementById('added-items-list');
const addedItemsGrid = document.getElementById('added-items-grid');
const addedCount = document.getElementById('added-count');

const themeSwitch = document.getElementById('theme-switch');
const themeText = document.getElementById('theme-text');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

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

// Toast notification helper
function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toastNotification.className = 'toast show';
  
  // Icon styling can be adjusted based on type if needed
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

// Redirect Helper
function navigateToView() {
  if (window.location.protocol === 'file:') {
    window.location.href = 'view.html';
  } else {
    window.location.href = '/view';
  }
}

async function hasScheduleToView() {
  try {
    const response = await fetch('/api/schedule');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        return true;
      }
    }
  } catch (error) {
    console.warn('Could not check server schedule:', error);
  }

  try {
    const savedSchedule = localStorage.getItem('whatprogramstoday_schedule');
    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      return Array.isArray(parsed) && parsed.length > 0;
    }
  } catch (error) {
    console.warn('Could not read cached schedule:', error);
  }

  return false;
}

// Returns today's date string in YYYY-MM-DD format using Sydney/Melbourne timezone
function getSydneyDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

// Fetch lists from text files
async function loadSourceData() {
  try {
    const schoolsResponse = await fetch('schools.txt');
    if (schoolsResponse.ok) {
      const text = await schoolsResponse.text();
      schoolsList = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } else {
      console.warn('Could not load schools.txt. Using defaults.');
      schoolsList = ['Sydney Public School', 'Melbourne Grammar', 'Albert Park Primary'];
    }

    const programsResponse = await fetch('programs.txt');
    if (programsResponse.ok) {
      const text = await programsResponse.text();
      programsList = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    } else {
      console.warn('Could not load programs.txt. Using defaults.');
      programsList = ['Science Camp', 'Robotics Workshop', 'Coding Bootcamp'];
    }
  } catch (error) {
    console.error('Error fetching source data:', error);
    // Safe fallbacks
    schoolsList = ['Sydney Grammar School', 'Melbourne High School', 'Oakleigh Primary School'];
    programsList = ['Science Camp', 'Robotics Workshop', 'Coding Bootcamp'];
  }
}

// Custom Combobox Dropdown Logic
function setupDropdown(combobox, input, dropdown, itemsList) {
  // Toggle dropdown on input click/focus
  input.addEventListener('focus', () => {
    filterAndShowDropdown(input, dropdown, itemsList);
    combobox.classList.add('active');
  });

  // Filter items as user types
  input.addEventListener('input', () => {
    filterAndShowDropdown(input, dropdown, itemsList);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!combobox.contains(e.target)) {
      dropdown.classList.remove('show');
      combobox.classList.remove('active');
    }
  });
}

function filterAndShowDropdown(input, dropdown, itemsList) {
  const filterText = input.value.toLowerCase().trim();
  dropdown.innerHTML = '';

  const filteredItems = itemsList.filter(item => 
    item.toLowerCase().includes(filterText)
  );

  // If there are options to show, build them
  if (filteredItems.length > 0) {
    filteredItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.textContent = item;
      
      div.addEventListener('click', () => {
        input.value = item;
        dropdown.classList.remove('show');
        input.dispatchEvent(new Event('change')); // trigger default change event
      });
      
      dropdown.appendChild(div);
    });
  }

  // If user typed a unique name that is not in the list, offer to add it as custom
  if (filterText && !itemsList.some(item => item.toLowerCase() === filterText)) {
    const customDiv = document.createElement('div');
    customDiv.className = 'dropdown-item';
    customDiv.innerHTML = `<span>Use "<strong>${input.value}</strong>"</span> <span class="item-badge">New</span>`;
    customDiv.addEventListener('click', () => {
      // Keep user's custom input value
      dropdown.classList.remove('show');
    });
    dropdown.appendChild(customDiv);
  }

  dropdown.classList.add('show');
}

// Navigation between hub and builder screens
goToCreateBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
  creatorScreen.style.display = 'block';
  schoolInput.focus();
});

goToViewBtn.addEventListener('click', async () => {
  const hasSchedule = await hasScheduleToView();

  if (!hasSchedule) {
    showToast("No schedule published yet. Build one first!", "error");
    welcomeScreen.style.display = 'none';
    creatorScreen.style.display = 'block';
    schoolInput.focus();
  } else {
    navigateToView();
  }
});

formBackBtn.addEventListener('click', () => {
  creatorScreen.style.display = 'none';
  welcomeScreen.style.display = 'flex';
});

logoLink.addEventListener('click', (e) => {
  e.preventDefault();
  creatorScreen.style.display = 'none';
  welcomeScreen.style.display = 'flex';
});

// Add single item to current local schedule list
function addEntryToSchedule() {
  const schoolVal = schoolInput.value.trim();
  const programVal = programInput.value.trim();

  if (!schoolVal) {
    showToast("Please select or enter a School Name", "error");
    schoolInput.focus();
    return false;
  }

  if (!programVal) {
    showToast("Please select or enter a Program Name", "error");
    programInput.focus();
    return false;
  }

  // Add to schedule array
  currentSchedule.push({
    school: schoolVal,
    program: programVal
  });

  // Re-render schedule list
  renderScheduleList();

  // Reset program selection
  programInput.value = '';
  
  // Note: "If the user choose to add more, school name will be default to the previous choice, but it can be changed from the drop down menu."
  // So we DO NOT clear the schoolInput, it remains defaulted to the last selected school name.
  
  programInput.focus();
  showToast("Added entry successfully!");
  return true;
}

// Remove item from local list
function removeEntryFromSchedule(index) {
  currentSchedule.splice(index, 1);
  renderScheduleList();
  showToast("Entry removed");
}

// Render schedule list in creator screen
function renderScheduleList() {
  addedItemsGrid.innerHTML = '';
  
  if (currentSchedule.length === 0) {
    addedItemsList.style.display = 'none';
    addedCount.textContent = '0';
    return;
  }

  addedItemsList.style.display = 'block';
  addedCount.textContent = currentSchedule.length;

  currentSchedule.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'added-item-row';
    
    row.innerHTML = `
      <div class="added-item-details">
        <span class="added-item-program">${entry.program}</span>
        <span class="added-item-school">${entry.school}</span>
      </div>
      <button type="button" class="btn-danger-icon" title="Remove entry" onclick="removeEntryFromSchedule(${index})">
        <i data-lucide="trash-2" style="width: 1.25rem; height: 1.25rem;"></i>
      </button>
    `;

    addedItemsGrid.appendChild(row);
  });

  lucide.createIcons();
}

// Expose remove function to global scope so inline onclick works
window.removeEntryFromSchedule = removeEntryFromSchedule;

// Add Entry Action
addMoreBtn.addEventListener('click', () => {
  addEntryToSchedule();
});

// Form submit action (Publish & Redirect)
submitScheduleBtn.addEventListener('click', async () => {
  // If user has filled the inputs but hasn't clicked "Add to Schedule" yet,
  // we auto-add it so they don't lose that entry!
  const schoolVal = schoolInput.value.trim();
  const programVal = programInput.value.trim();
  
  if (schoolVal && programVal) {
    // Add current form state to list first
    currentSchedule.push({
      school: schoolVal,
      program: programVal
    });
  }

  if (currentSchedule.length === 0) {
    showToast("Please add at least one program to the schedule", "error");
    return;
  }

  // Show loading state on button
  submitScheduleBtn.disabled = true;
  submitScheduleBtn.innerHTML = `<i data-lucide="loader-2"></i> Publishing...`;
  lucide.createIcons();

  try {
    // POST schedule to the Supabase-backed API
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: getSydneyDateString(),
        entries: currentSchedule
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Publish failed');
    }

    localStorage.setItem('whatprogramstoday_schedule', JSON.stringify(currentSchedule));
    showToast("Schedule published! Redirecting...", "info");
    setTimeout(() => navigateToView(), 1000);

  } catch (error) {
    console.error('Publish error:', error);
    showToast(error.message || "Could not publish. Check your connection and try again.", "error");
    // Restore button
    submitScheduleBtn.disabled = false;
    submitScheduleBtn.innerHTML = `<i data-lucide="check-circle-2"></i> Publish &amp; View`;
    lucide.createIcons();
  }
});

// App Initialization
async function init() {
  initTheme();
  await loadSourceData();
  setupDropdown(schoolCombobox, schoolInput, schoolDropdown, schoolsList);
  setupDropdown(programCombobox, programInput, programDropdown, programsList);

  // Try to resume today's schedule from the server so the builder can
  // pick up where it left off after a page refresh.
  // Silently ignored when running locally via file:// (no API available).
  try {
    const response = await fetch('/api/schedule');
    if (response.ok) {
      const data = await response.json();
      if (data.entries && data.entries.length > 0) {
        currentSchedule = data.entries;
        renderScheduleList();
        showToast("Resumed today's saved schedule", "info");
      }
    }
  } catch (e) {
    // API not available (e.g. file:// local mode) — start with empty schedule
  }
}

document.addEventListener('DOMContentLoaded', init);
