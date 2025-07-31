// =======================
// GLOBAL VARIABLES
// =======================
let foodEntries = [];
let favoriteFoods = [];
let bpLineChartInstance = null;
let timelineDotChartInstance = null;
let bpReminderShown = false;
let welcomeShown = false;

// =======================
// DOM READY
// =======================
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("dateInput").value = today;
  
  loadFromStorage();
  setupEventListeners();
  
  // Check if welcome popup should be shown (only once ever)
  checkWelcomePopup();
  
  // Check for daily BP reminder (subtle visual cue)
  checkBPReminder();
  renderAllEntries();
  updateCharts(foodEntries);
  generateAISuggestions(foodEntries);
});

// =======================
// INITIAL LOAD FUNCTIONS
// =======================
function loadFromStorage() {
  const savedFavorites = localStorage.getItem("favoriteFoods");
  const savedEntries = localStorage.getItem("foodEntries");
  favoriteFoods = savedFavorites ? JSON.parse(savedFavorites) : [];
  foodEntries = savedEntries ? JSON.parse(savedEntries) : [];
}

function renderAllEntries() {
  // 1. Sort all entries by date, descending
  foodEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2. Clear the current list and render the sorted entries
  const list = document.getElementById("foodLogList");
  list.innerHTML = "";
  foodEntries.forEach(renderEntry);
}

function renderFavorites() {
  // Render the favorites list separately
  const favList = document.getElementById("favoritesList");
  favList.innerHTML = "";
  favoriteFoods.forEach(entry => addToFavorites(entry, false));
}

// =======================
// EVENT LISTENERS
// =======================
function setupEventListeners() {
  document.getElementById("addLogButton").addEventListener("click", handleAddLog);
  document.getElementById("clearAllButton").addEventListener("click", clearAllEntries);
  document.getElementById("mealDropdown").addEventListener("change", handleMealFilter);
  document.getElementById("filterAllButton").addEventListener("click", () => filterEntries('all'));
  document.getElementById("filterSickButton").addEventListener("click", () => filterEntries('sick'));
  document.getElementById("filterOkayButton").addEventListener("click", () => filterEntries('okay'));

  // BP Reminder Popup Event Listeners
  document.getElementById("closeBpPopup").addEventListener("click", closeBPReminderPopup);
  document.getElementById("addBpNow").addEventListener("click", handleAddBPNow);
  document.getElementById("skipToday").addEventListener("click", handleSkipToday);

  document.querySelectorAll(".collapsible").forEach(button => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const content = button.nextElementSibling;
      if (content) {
        const isExpanded = content.style.display === "none";
        content.style.display = isExpanded ? "block" : "none";
        if (isExpanded && foodEntries.length > 0) updateCharts(foodEntries);
      }
    });
  });
}

function handleMealFilter() {
  const selected = this.value;
  const filtered = selected === "all" ? foodEntries : foodEntries.filter(e => e.mealType === selected);
  updateCharts(filtered);
}

function filterEntries(filter) {
  const list = document.getElementById("foodLogList");
  list.innerHTML = ""; // Clear the list

  let filteredEntries = foodEntries;

  if (filter === 'sick') {
    filteredEntries = foodEntries.filter(entry => entry.sick);
  } else if (filter === 'okay') {
    filteredEntries = foodEntries.filter(entry => !entry.sick);
  }

  // Sort the filtered entries by date before rendering
  filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  filteredEntries.forEach(renderEntry);
}

function clearAllEntries() {
  foodEntries = [];
  localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
  renderAllEntries(); // This will now correctly re-render the empty list
  updateCharts(foodEntries);
  generateAISuggestions(foodEntries);
}

// =======================
// ADD ENTRY
// =======================
function handleAddLog() {
  const food = document.getElementById("foodInput").value.trim();
  const date = document.getElementById("dateInput").value;
  const bps = document.getElementById("bpsInput").value.trim();
  const sick = document.getElementById("sickInput").checked;
  const mealType = document.getElementById("mealTypeInput").value;
  const calories = document.getElementById("caloriesInput").value.trim();
  const bsValue = document.getElementById("bsInput").value;

  if (!food) return alert("Please enter a food item.");

  // Store current scroll position
  const currentScrollY = window.scrollY;
  const entryForm = document.getElementById("entryForm");
  const formRect = entryForm.getBoundingClientRect();
  const formTop = formRect.top + currentScrollY;

  const newEntry = {
    food,
    date: date || "No date",
    bps: isNaN(parseInt(bps)) ? null : parseInt(bps),
    sick,
    mealType: mealType || "Unspecified",
    calories: calories || "N/A",
    bs: bsValue
  };

  foodEntries.push(newEntry);
  localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
  
  // Render updates without jumping
  renderAllEntries();
  updateCharts(foodEntries);
  generateAISuggestions(foodEntries);

  // Check if BP reminder should be shown after adding entry
  checkBPReminder();

  // Clear form inputs
  document.getElementById("foodInput").value = "";
  document.getElementById("dateInput").value = "";
  document.getElementById("bpsInput").value = "";
  document.getElementById("sickInput").checked = false;
  document.getElementById("mealTypeInput").selectedIndex = 0;
  document.getElementById("caloriesInput").value = "";
  document.getElementById("bsInput").selectedIndex = 0;

  // Restore scroll position to keep form visible
  setTimeout(() => {
    window.scrollTo({
      top: formTop - 20, // Small offset for better visibility
      behavior: 'smooth'
    });
    
    // Focus back on food input for easy consecutive entries
    document.getElementById("foodInput").focus();
  }, 100);
}

// =======================
// RENDER ENTRY
// =======================
function renderEntry(entry) {
  const li = document.createElement("li");
  li.innerHTML = `
  <strong>${entry.date}</strong> - ${entry.food} (${entry.mealType})<br>
  Calories: ${entry.calories} | BP: ${entry.bps} | BS: ${entry.bs}<br>
  ${entry.sick ? "🤢 Felt Sick" : "🥳 Felt Okay"}
`;

  const favBtn = document.createElement("button");
  favBtn.textContent = "⭐️";
  favBtn.className = "favorite-btn";
  favBtn.disabled = entry.sick;
  favBtn.title = entry.sick ? "🚫 Can't favorite sick foods!" : "Save as favorite";
  favBtn.style.opacity = entry.sick ? "0.5" : "1";
  favBtn.addEventListener("click", () => addToFavorites(entry, true));

  const delBtn = document.createElement("button");
  delBtn.textContent = "✖️";
  delBtn.className = "delete-btn";
  delBtn.addEventListener("click", () => {
    li.remove();
    foodEntries = foodEntries.filter(e => e !== entry);
    localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
    updateCharts(foodEntries);
    generateAISuggestions(foodEntries);
  });

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "0.5rem";
  wrapper.appendChild(favBtn);
  wrapper.appendChild(delBtn);

  li.appendChild(wrapper);
  document.getElementById("foodLogList").appendChild(li);
}

// =======================
// FAVORITES
// =======================
function addToFavorites(entry, save = true) {
  const list = document.getElementById("favoritesList");
  const exists = Array.from(list.children).some(li =>
    li.dataset.food === entry.food.toLowerCase() && li.dataset.date === entry.date
  );
  if (exists) return;

  const li = document.createElement("li");
  li.dataset.food = entry.food.toLowerCase();
  li.dataset.date = entry.date;

  const span = document.createElement("span");
  span.textContent = `${entry.date}  ${entry.food} (${entry.mealType}) | Cal: ${entry.calories} | BP: ${entry.bps} | BS: ${entry.bs}`;
  span.style.flexGrow = "1";

  const delBtn = document.createElement("button");
  delBtn.textContent = "✖️";
  delBtn.className = "delete-btn";
  delBtn.addEventListener("click", () => {
    li.remove();
    favoriteFoods = favoriteFoods.filter(e => e !== entry);
    localStorage.setItem("favoriteFoods", JSON.stringify(favoriteFoods));
  });

  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.appendChild(span);
  li.appendChild(delBtn);
  list.appendChild(li);

  if (save) {
    favoriteFoods.push(entry);
    localStorage.setItem("favoriteFoods", JSON.stringify(favoriteFoods));
  }
}

// =======================
// AI SUGGESTIONS
// =======================
function generateAISuggestions(entries) {
  const container = document.getElementById("aiSuggestions");
  if (!container) return;

  const sickCount = {}, safeCount = {};
  entries.forEach(entry => {
    const name = entry.food.toLowerCase();
    if (entry.sick) sickCount[name] = (sickCount[name] || 0) + 1;
    else safeCount[name] = (safeCount[name] || 0) + 1;
  });

  const suggestions = [];
  for (let food in sickCount) {
    if (sickCount[food] >= 2) suggestions.push(`⚠️ You've felt sick after eating *${food}* ${sickCount[food]} times. Maybe avoid it?`);
  }
  for (let food in safeCount) {
    if (safeCount[food] >= 2 && !sickCount[food]) suggestions.push(`✅ You've eaten *${food}* ${safeCount[food]} times and felt fine.`);
  }

  container.innerHTML = suggestions.map(s => `<p>${s}</p>`).join("");
}

// =======================
// UPDATE CHARTS
// =======================
function updateCharts(logs) {
  if (!logs || logs.length === 0) {
    if (bpLineChartInstance) bpLineChartInstance.destroy();
    if (timelineDotChartInstance) timelineDotChartInstance.destroy();
    return;
  }

  const bpCtx = document.getElementById("bpLineChart")?.getContext("2d");
  const dotCtx = document.getElementById("timelineDotChart")?.getContext("2d");

  const bpData = logs
  .filter(e => e.bps !== null && !isNaN(e.bps))
  .map(e => ({x: e.date, y: parseInt(e.bps)}))
  .sort((a, b) => new Date(a.x) - new Date(b.x));

  if (bpLineChartInstance) bpLineChartInstance.destroy();
  
  if (bpCtx) {
    bpLineChartInstance = new Chart(bpCtx, {
      type: "line",
      data: {
        datasets: [{
          label: "Blood Pressure (Systolic)",
          data: bpData,
          borderColor: "#087E8B",
          backgroundColor: "rgba(8,126,139,0.08)", // Lighter, more transparent fill
          fill: true,
          tension: 0.2,
          pointRadius: 4,
          pointBackgroundColor: "#087E8B"
        }]
      },
      options: {
        parsing: { xAxisKey: "x", yAxisKey: "y" },
        scales: {
          x: { type: "time", time: { unit: "day" }, title: { display: true, text: "Date" }},
          y: { title: { display: true, text: "Systolic BP" }}
        },
        plugins: { title: { display: true, text: "Blood Pressure Trend" }}
      }
    });
  }

  const mealColors = {
    Breakfast: '#729885',
    Lunch: '#087E8B',
    Dinner: '#2C2C2C',
    Snacks: '#E5DED2',
    Dessert: '#E7B9B4'
  };

  const dotData = logs.map(entry => ({
    x: entry.date,
    y: entry.sick ? 1 + (Math.random() - 0.5) * 0.8 : 2 + (Math.random() - 0.5) * 0.8, // Strong jitter
    food: entry.food,
    sick: entry.sick,
    mealType: entry.mealType || "Unspecified"
  }));

  if (timelineDotChartInstance) timelineDotChartInstance.destroy();
  if (dotCtx) {
    timelineDotChartInstance = new Chart(dotCtx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Food Reactions",
          data: dotData,
          pointRadius: 8,
          backgroundColor: dotData.map(d => mealColors[d.mealType] || "#808080"),
          borderColor: dotData.map(d => d.sick ? '#FF1493' : 'rgba(0, 0, 0, 0.1)'),
          borderWidth: dotData.map(d => d.sick ? 3 : 1)
        }]
      },
      options: {
        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
        animation: { duration: 1000, easing: "easeOutQuart" },
        scales: {
          x: { type: "time", time: { unit: "day" }, title: { display: true, text: "Date" }},
          y: {
            min: 0.5, max: 2.5,
            ticks: {
              stepSize: 1,
              callback: val => {
                if (val >= 0.8 && val < 1.2) return "🤢 Sick";
                if (val >= 1.8 && val < 2.2) return "🥳 Okay";
                return "";
              }
            },
            title: { display: true, text: "Reaction" }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              generateLabels: () =>
                Object.entries(mealColors).map(([type, color]) => ({
                  text: type, fillStyle: color, hidden: false
                })),
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          title: { display: true, text: "Sick vs Okay Timeline" },
          tooltip: {
            callbacks: {
              label: ctx => {
                const e = ctx.raw;
                if (!e || !e.x || !e.food) return "Unknown";
                return `${e.x}: ${e.food} → ${e.sick ? "🤢 Sick" : "🥳 Okay"}`;
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            bottom: 40
          }
        }
      }
    });
  }

  // Ensure AI suggestions are always updated after charts
  generateAISuggestions(logs);
}

// =======================
// WELCOME POPUP FUNCTIONALITY
// =======================
function checkWelcomePopup() {
  // Check if welcome popup has been shown before
  const welcomeFlag = localStorage.getItem("welcomeShown");
  console.log("Welcome flag from localStorage:", welcomeFlag);
  
  welcomeShown = welcomeFlag === "true";
  console.log("Welcome shown status:", welcomeShown);
  
  if (!welcomeShown) {
    console.log("Showing welcome popup...");
    showWelcomePopup();
    localStorage.setItem("welcomeShown", "true");
  } else {
    console.log("Welcome popup already shown, skipping...");
  }
}

function checkBPReminder() {
  // Check if BP has been entered today
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = foodEntries.filter(entry => entry.date === today);
  const todayBPEntries = todayEntries.filter(entry => entry.bps);
  
  console.log("Today's food entries:", todayEntries.length);
  console.log("Today's BP entries:", todayBPEntries.length);
  
  // Show BP popup reminder if user has made 2+ entries today AND no BP entered
  if (todayEntries.length >= 2 && todayBPEntries.length === 0) {
    console.log("Showing BP reminder popup");
    showBPReminderPopup();
  } else {
    console.log("Not showing BP reminder - need 2+ entries and 0 BP entries");
  }
}

function showBPReminderPopup() {
  // Check if BP reminder was already shown today
  const today = new Date().toISOString().split('T')[0];
  const bpReminderShownToday = localStorage.getItem(`bpReminderShown_${today}`);
  
  if (!bpReminderShownToday) {
    const popup = document.getElementById('bpReminderPopup');
    if (popup) {
      popup.style.display = 'block';
      // Mark as shown for today
      localStorage.setItem(`bpReminderShown_${today}`, 'true');
    }
  }
}

function closeBPReminderPopup() {
  const popup = document.getElementById('bpReminderPopup');
  if (popup) {
    popup.style.display = 'none';
  }
}

function showWelcomePopup() {
  const popup = document.getElementById('bpReminderPopup');
  if (popup) {
    popup.style.display = 'block';
    // Set today's date in the date input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;
  }
}

function handleAddBPNow() {
  closeBPReminderPopup();
  // Mark welcome as shown permanently
  localStorage.setItem("welcomeShown", "true");
  
  // Focus on the food input field to get started
  const foodInput = document.getElementById('foodInput');
  const entryForm = document.getElementById('entryForm');
  
  if (foodInput && entryForm) {
    entryForm.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      foodInput.focus();
    }, 500);
  }
}

function handleSkipToday() {
  closeBPReminderPopup();
  // Mark welcome as shown permanently
  localStorage.setItem("welcomeShown", "true");
}
