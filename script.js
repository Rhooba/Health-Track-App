// =======================
// GLOBAL VARIABLES
// =======================
let foodEntries = [];
let favoriteFoods = [];
let bpLineChartInstance = null;
let dailyCombinationChartInstance = null;
let bpReminderShown = false;
let welcomeShown = false;

// =======================
// FOOD CATEGORIZATION SYSTEM
// Based on "The Eat Out Guide" from Rachelstea.com
// W + S = OK, W + P = OK, S + P = NO WAY
// =======================

// W Foods (Neutral/Safe with both S and P)
const W_FOODS = [
  'artichoke', 'asparagus', 'brussels sprouts', 'cabbage', 'cauliflower',
  'celery', 'cilantro', 'eggplant', 'green beans', 'leafy greens', 'lettuce',
  'mayonnaise', 'mushroom', 'green peppers', 'okra', 'olive oil', 'onions',
  'seasonings', 'tomato', 'vegetable oil', 'vinegar', 'wheat grass',
  'yellow mustard', 'zucchini', 'broccoli', 'cucumber', 'herbs', 'spices',
  'bell peppers', 'radish', 'spinach', 'kale', 'arugula', 'watercress',
  'parsley', 'basil', 'oregano', 'thyme', 'rosemary', 'sage', 'dill',
  'chives', 'scallions', 'leeks', 'garlic', 'ginger', 'turmeric'
];

// S Foods (Starches/Carbohydrates)
const S_FOODS = [
  'acorn squash', 'banana', 'beets', 'cornbread', 'lemon', 'lima beans',
  'oatmeal', 'tortillas', 'bread', 'coconut milk', 'fruits', 'lime',
  'orange peppers', 'turnips', 'butternut squash', 'dates', 'grapes',
  'pasta', 'rice', 'vegetable broth', 'avocado', 'dried fruit', 'honey',
  'pickle relish', 'rice milk', 'water chestnuts', 'carrots', 'potato chips',
  'sauerkraut', 'wine', 'chia', 'chocolate', 'legumes', 'pretzels', 'sugar',
  'yams', 'potatoes', 'sweet potatoes', 'corn', 'quinoa', 'oats', 'barley',
  'wheat', 'rye', 'millet', 'buckwheat', 'amaranth', 'crackers', 'cereal',
  'muffins', 'bagels', 'pancakes', 'waffles', 'toast', 'noodles', 'couscous',
  'bulgur', 'polenta', 'risotto', 'pilaf', 'beans', 'lentils', 'chickpeas',
  'black beans', 'kidney beans', 'pinto beans', 'navy beans', 'split peas',
  'apple', 'orange', 'pear', 'peach', 'plum', 'cherry', 'strawberry',
  'blueberry', 'raspberry', 'blackberry', 'cranberry', 'pineapple', 'mango',
  'papaya', 'kiwi', 'cantaloupe', 'watermelon', 'honeydew', 'grapefruit'
];

// P Foods (Proteins)
const P_FOODS = [
  'eggs', 'fish', 'pork', 'beef', 'cheese', 'meat broth', 'chicken',
  'milk products', 'venison', 'turkey', 'lamb', 'duck', 'goose', 'salmon',
  'tuna', 'cod', 'halibut', 'trout', 'sardines', 'anchovies', 'shrimp',
  'crab', 'lobster', 'scallops', 'mussels', 'clams', 'oysters', 'squid',
  'milk', 'yogurt', 'cream', 'butter', 'cottage cheese', 'ricotta',
  'mozzarella', 'cheddar', 'swiss', 'parmesan', 'feta', 'goat cheese',
  'cream cheese', 'sour cream', 'whey protein', 'casein', 'protein powder',
  'tofu', 'tempeh', 'seitan', 'nuts', 'almonds', 'walnuts', 'pecans',
  'cashews', 'pistachios', 'brazil nuts', 'hazelnuts', 'macadamia nuts',
  'peanuts', 'peanut butter', 'almond butter', 'tahini', 'seeds',
  'sunflower seeds', 'pumpkin seeds', 'sesame seeds', 'flax seeds'
];

// T Foods (Trigger Foods)
const T_FOODS = [
'yogurt', 'milk(all)', 'nut butter', 'seed butter', 'cottage cheese', 'sour cream',
'boost shake', 'ensure shake', 'quinoa', 'carbonated drinks(discouraged)'
];

// Function to categorize a food item
function categorizeFoodItem(foodName) {
  const food = foodName.toLowerCase().trim();
  
  // Check each category
  if (W_FOODS.some(wFood => food.includes(wFood) || wFood.includes(food))) {
    return 'W';
  }
  if (S_FOODS.some(sFood => food.includes(sFood) || sFood.includes(food))) {
    return 'S';
  }
  if (P_FOODS.some(pFood => food.includes(pFood) || pFood.includes(food))) {
    return 'P';
  }
  
  // Default to W (neutral) if not found
  return 'W';
}

// Function to check if food combinations are safe
function checkFoodCombination(categories) {
  const hasS = categories.includes('S');
  const hasP = categories.includes('P');
  
  // S + P = NO WAY (unsafe combination)
  if (hasS && hasP) {
    return { safe: false, warning: 'S + P combination detected!' };
  }
  
  // W + S = OK, W + P = OK, W only = OK
  return { safe: true, warning: null };
}
// =======================
// HELPER FUNCTIONS
// =======================

// Helper function for time of day on category bar chart
function getTimeOfDay(dateStr) {
  // Accepts the timestamps and returns string "morning", "afternoon", "evening", "night"
  const hour = new Date(dateStr).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

// Group entries by period and the category
function groupEntriesByPeriod(entries) {
  const periods = { Morning: {}, Afternoon: {}, Evening: {} };
  for (let entry of entries) {
    const when = getTimeOfDay(entry.timestamp) || entry.date;
    const cat = categorizeFoodItem(entry.food);
    if (!periods[when][cat]) periods[when][cat] = [];
    periods[when][cat].push(entry);
  }
  return periods;
}

const periods = ["Morning", "Afternoon", "Evening"];
const byPeriod = groupEntriesByPeriod(foodEntries);

const datasets = ["W", "S", "P"].map(cat => ({
  label: `${cat} Foods`, 
  backgroundColor: cat === "W" ? "#FFD700" : cat === "S" ? "#FFB6C1" : "#FF69B4",
  data: periods.map(period => {
    const entries = byPeriod[period][cat] || [];
    // dont count but store the whole array
    return { count: entries.length, entries };
    })
}));

// =======================
// DOM READY
// =======================
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date as default
  const today = new Date().toLocaleDateString();
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
  document.getElementById("exportEncryptedButton").addEventListener("click", handleExportEncrypted);
  document.getElementById("filterAllButton").addEventListener("click", () => filterEntries('all'));
  document.getElementById("filterSickButton").addEventListener("click", () => filterEntries('sick'));
  document.getElementById("filterOkayButton").addEventListener("click", () => filterEntries('okay'));

  // BP Reminder Popup Event Listeners
  document.getElementById("closeBpPopup").addEventListener("click", closeBPReminderPopup);
  document.getElementById("addBpNow").addEventListener("click", handleAddBPNow);
  document.getElementById("skipToday").addEventListener("click", handleSkipToday);

  // BP Reminder Only Popup Event Listeners
  document.getElementById("closeBpReminderOnly").addEventListener("click", closeBPReminderOnlyPopup);
  document.getElementById("addBpNowReminder").addEventListener("click", handleBPReminderGotIt);
  document.getElementById("skipBpToday").addEventListener("click", handleSkipBPToday);

  document.querySelectorAll(".collapsible").forEach(button => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const content = button.nextElementSibling;
      if (content) {
        const isExpanded = content.style.display === "none";
        content.style.display = isExpanded ? "block" : "none";
      }
    });
  });
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

function handleExportEncrypted() {
  if (foodEntries.length === 0) {
    alert("No data to export. Please add some food entries first.");
    return;
  }
  
  // Check if user has a saved password
  const savedPassword = localStorage.getItem('exportPassword');
  showPasswordForm(savedPassword);
}

function showPasswordForm(savedPassword = '') {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'passwordFormOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Create the form container
  const formContainer = document.createElement('div');
  formContainer.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    text-align: center;
  `;
  
  // Create the form
  formContainer.innerHTML = `
    <h3 style="margin-top: 0; color: #333;">🔐 Export Password</h3>
    <p style="color: #666; margin-bottom: 20px;">
      ${savedPassword ? 'Use your saved password or enter a new one:' : 'Create a password to protect your medical data:'}<br>
      <strong>Your doctor will need this password to view the report.</strong>
    </p>
    
    <div style="margin-bottom: 15px;">
      <label for="exportPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">Password:</label>
      <input 
        type="password" 
        id="exportPassword" 
        placeholder="Enter password (min 6 characters)"
        style="
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
        "
        required
        minlength="6"
      >
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: flex; align-items: center; justify-content: center; color: #666;">
        <input type="checkbox" id="savePassword" ${savedPassword ? 'checked' : ''} style="margin-right: 8px;">
        Remember this password for future exports
      </label>
    </div>
    
    <div style="margin-top: 20px;">
      <button 
        type="button" 
        id="createReport"
        style="
          background-color: #007cba;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          margin-right: 10px;
        "
      >
        📊 Create Medical Report
      </button>
      <button 
        type="button" 
        id="cancelExport"
        style="
          background-color: #ccc;
          color: #333;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        "
      >
        Cancel
      </button>
    </div>
    
    ${savedPassword ? `
    <div style="margin-top: 15px;">
      <button 
        type="button" 
        id="clearPassword"
        style="
          background-color: #ff6b6b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        "
      >
        🗑️ Clear Saved Password
      </button>
    </div>
    ` : ''}
    
    <p style="font-size: 12px; color: #999; margin-top: 15px;">
      💡 Password is saved locally in your browser for convenience
    </p>
  `;
  
  overlay.appendChild(formContainer);
  document.body.appendChild(overlay);
  
  // Focus the password input
  const passwordInput = document.getElementById('exportPassword');
  setTimeout(() => {
    passwordInput.focus();
  }, 100);
  
  // Handle create report
  document.getElementById('createReport').addEventListener('click', function() {
    const password = passwordInput.value.trim();
    const savePassword = document.getElementById('savePassword').checked;
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters long for security.");
      passwordInput.focus();
      return;
    }
    
    // Save password if requested
    if (savePassword) {
      localStorage.setItem('exportPassword', password);
    } else {
      localStorage.removeItem('exportPassword');
    }
    
    // Remove the form
    document.body.removeChild(overlay);
    
    // Proceed with export (password only, no username)
    exportMedicalDataToEncryptedCSV(password);
  });
  
  // Handle clear password
  if (savedPassword) {
    document.getElementById('clearPassword').addEventListener('click', function() {
      if (confirm('Are you sure you want to clear your saved password?')) {
        localStorage.removeItem('exportPassword');
        document.body.removeChild(overlay);
        showPasswordForm(); // Show fresh form
      }
    });
  }
  
  // Handle cancel
  document.getElementById('cancelExport').addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  // Close on overlay click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // Allow Enter key to submit
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('createReport').click();
    }
  });
}

function exportMedicalDataToEncryptedCSV(password) {
  // Create medical-friendly CSV data
  let csvData = [];
  
  // Sort entries by date for doctor review
  const sortedEntries = foodEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Convert to structured data
  sortedEntries.forEach(entry => {
    csvData.push({
      date: entry.date || new Date().toLocaleDateString(), // Use locale format to match chart filtering
      food: entry.food,
      mealType: entry.mealType || "Unspecified",
      calories: entry.calories || "Not recorded",
      bloodPressure: entry.bps || "Not recorded",
      feltSick: entry.sick ? "Yes" : "No",
      bowelScore: entry.bs || "Not recorded",
      timestamp: entry.timestamp || "Not recorded"
    });
  });
  
  // Create summary statistics
  const summary = {
    totalEntries: foodEntries.length,
    sickEpisodes: foodEntries.filter(e => e.sick).length,
    dateRange: `${sortedEntries[0]?.date} to ${sortedEntries[sortedEntries.length - 1]?.date}`,
    exportDate: new Date().toLocaleDateString()
  };
  
  // Encrypt the data (simple but effective)
  const dataToEncrypt = JSON.stringify({ csvData, summary });
  const encrypted = btoa(dataToEncrypt); // Base64 encoding
  
  // Create self-decrypting HTML file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Data Report - Password Protected</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #f5f5f5; 
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .password-prompt { 
            text-align: center; 
            padding: 50px; 
            border: 2px dashed #ccc; 
            border-radius: 8px; 
            margin: 50px 0; 
        }
        .password-input { 
            padding: 12px; 
            font-size: 16px; 
            border: 2px solid #ddd; 
            border-radius: 4px; 
            margin: 10px; 
            width: 200px; 
        }
        .decrypt-btn { 
            padding: 12px 24px; 
            font-size: 16px; 
            background-color: #007cba; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
        }
        .decrypt-btn:hover { background-color: #005a87; }
        .medical-data { display: none; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
        }
        .summary { 
            background-color: #e8f4f8; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            color: #333; 
        }
        .error { 
            color: #d32f2f; 
            margin: 10px 0; 
        }
        @media print {
            .password-prompt { display: none; }
            .medical-data { display: block !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Medical Data Report</h1>
            <p>Food & Health Tracking Data</p>
        </div>
        
        <div id="passwordPrompt" class="password-prompt">
            <h2>🔒 Password Required</h2>
            <p>This medical data is password-protected for privacy.</p>
            <p>Please enter the password provided by the patient:</p>
            <br>
            <input type="password" id="passwordInput" class="password-input" placeholder="Enter password" />
            <br>
            <button onclick="decryptData()" class="decrypt-btn">Decrypt Medical Data</button>
            <div id="errorMsg" class="error"></div>
        </div>
        
        <div id="medicalData" class="medical-data">
            <div class="summary">
                <h3>📊 Weekly Summary</h3>
                <div id="summaryContent"></div>
            </div>
            
            <h3>📋 Detailed Food & Health Log</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Food Item</th>
                        <th>Meal Type</th>
                        <th>Calories</th>
                        <th>Blood Pressure</th>
                        <th>Felt Sick</th>
                        <th>Bowel Score (1-7)</th>
                        <th>Time Recorded</th>
                    </tr>
                </thead>
                <tbody id="dataTable">
                </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Generated by Food Tracker App | Export Date: ${new Date().toLocaleDateString()}</p>
                <p>💡 Tip: Use Ctrl+P (Cmd+P on Mac) to print this report</p>
            </div>
        </div>
    </div>

    <script>
        const encryptedData = "${encrypted}";
        const correctPassword = "${password}";
        
        function decryptData() {
            const enteredPassword = document.getElementById('passwordInput').value;
            const errorMsg = document.getElementById('errorMsg');
            
            if (enteredPassword === correctPassword) {
                try {
                    const decryptedData = JSON.parse(atob(encryptedData));
                    displayMedicalData(decryptedData);
                    document.getElementById('passwordPrompt').style.display = 'none';
                    document.getElementById('medicalData').style.display = 'block';
                } catch (e) {
                    errorMsg.textContent = 'Error decrypting data. Please contact the patient.';
                }
            } else {
                errorMsg.textContent = 'Incorrect password. Please try again.';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
        }
        
        function displayMedicalData(data) {
            // Display summary
            const summaryHtml = \`
                <p><strong>Total Entries:</strong> \${data.summary.totalEntries}</p>
                <p><strong>Sick Episodes:</strong> \${data.summary.sickEpisodes}</p>
                <p><strong>Date Range:</strong> \${data.summary.dateRange}</p>
                <p><strong>Export Date:</strong> \${data.summary.exportDate}</p>
            \`;
            document.getElementById('summaryContent').innerHTML = summaryHtml;
            
            // Display table data
            const tableBody = document.getElementById('dataTable');
            data.csvData.forEach(entry => {
                const row = tableBody.insertRow();
                row.insertCell(0).textContent = entry.date;
                row.insertCell(1).textContent = entry.food;
                row.insertCell(2).textContent = entry.mealType;
                row.insertCell(3).textContent = entry.calories;
                row.insertCell(4).textContent = entry.bloodPressure;
                row.insertCell(5).textContent = entry.feltSick;
                row.insertCell(6).textContent = entry.bowelScore;
                row.insertCell(7).textContent = entry.timestamp;
            });
        }
        
        // Auto-focus password input and allow Enter key
        document.addEventListener('DOMContentLoaded', function() {
            const passwordInput = document.getElementById('passwordInput');
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    decryptData();
                }
            });
        });
    </script>
</body>
</html>`;

  // Create downloadable HTML file using data URL
  const encodedContent = encodeURIComponent(htmlContent);
  const dataUrl = `data:text/html;charset=utf-8,${encodedContent}`;
  
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = 'HealthReport.html';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success message with simple instructions
  alert(`✅ Your medical report has been exported successfully!\n\nPassword: "${password}"\n\nYou can now share the report and password with your healthcare expert.`);
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
    date: date ? new Date(date + 'T00:00:00').toLocaleDateString() : new Date().toLocaleDateString(), // Fix timezone offset
    timestamp: new Date().toLocaleString(), // Add timestamp when entry is created
    bps: isNaN(parseInt(bps)) ? null : parseInt(bps),
    sick,
    mealType: mealType || "Unspecified",
    calories: calories || "N/A",
    bs: bsValue
  };

  // Check food combination safety
  const categories = [categorizeFoodItem(newEntry.food)];
  if (newEntry.mealType) {
    categories.push(categorizeFoodItem(newEntry.mealType));
  }
  const safetyCheck = checkFoodCombination(categories);
  if (!safetyCheck.safe) {
    alert(`Warning: ${safetyCheck.warning}`);
  }

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
  <strong>${entry.date}</strong> - ${entry.food} (${entry.mealType})
  ${entry.timestamp ? `<br><small style="color: #666; font-size: 0.8rem;">⏰ ${entry.timestamp}</small>` : ''}
  <br>Calories: ${entry.calories} | BP: ${entry.bps} | BS: ${entry.bs}<br>
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
  console.log("🔍 updateCharts called with logs:", logs);
  
  if (!logs || logs.length === 0) {
    console.log("❌ No logs provided, destroying charts");
    if (bpLineChartInstance) bpLineChartInstance.destroy();
    if (dailyCombinationChartInstance) dailyCombinationChartInstance.destroy();
    return;
  }

  const bpCtx = document.getElementById("bpLineChart")?.getContext("2d");

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
        plugins: { title: { display: true, text: "Blood Pressure Trend" }},
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2
      }
    });
  }

  // Create Daily Food Combination Chart
  const combinationCtx = document.getElementById("dailyCombinationChart")?.getContext("2d");

  if (combinationCtx) {
    if (dailyCombinationChartInstance) dailyCombinationChartInstance.destroy();
    
    // Get today's entries only
    const today = new Date().toLocaleDateString();
    const todaysEntries = logs.filter(entry => entry.date === today);
    
    // Debug logging
    console.log("Today's date:", today);
    console.log("All logs:", logs);
    console.log("Today's entries:", todaysEntries);
    
    // Debug each entry's date format
    logs.forEach((entry, index) => {
      console.log(`Entry ${index}: "${entry.food}" - Date: "${entry.date}" (Type: ${typeof entry.date})`);
      console.log(`  Does "${entry.date}" === "${today}"?`, entry.date === today);
    });
    
    // Group entries by time period and track individual foods
    const timeData = {
      morning: { W: [], S: [], P: [], conflicts: [] },
      afternoon: { W: [], S: [], P: [], conflicts: [] },
      evening: { W: [], S: [], P: [], conflicts: [] }
    };
    
    // Map meal types to time periods
    const mealToTime = {
      'Breakfast': 'morning',
      'Lunch': 'afternoon', 
      'Dinner': 'evening',
      'Snacks': 'afternoon',
      'Dessert': 'evening'
    };
    
    // Process today's entries
    todaysEntries.forEach(entry => {
      const category = categorizeFoodItem(entry.food);
      const timePeriod = mealToTime[entry.mealType] || 'afternoon';
      
      // Store food details for tooltips
      const foodData = {
        name: entry.food,
        timestamp: entry.timestamp || 'No time recorded',
        sick: entry.sick,
        mealType: entry.mealType
      };
      
      timeData[timePeriod][category].push(foodData);
    });
    
    // Check for S+P conflicts in each time period
    Object.keys(timeData).forEach(period => {
      if (timeData[period].S.length > 0 && timeData[period].P.length > 0) {
        timeData[period].conflicts = [...timeData[period].S, ...timeData[period].P];
      }
    });
    
    // Create datasets for each food category
    const datasets = [
      {
        label: "W Foods (Neutral)",
        data: [timeData.morning.W.length, timeData.afternoon.W.length, timeData.evening.W.length],
        backgroundColor: "#729885",
        borderColor: "#729885",
        borderWidth: 1,
        foodDetails: [timeData.morning.W, timeData.afternoon.W, timeData.evening.W]
      },
      {
        label: "S Foods (Starches)",
        data: [timeData.morning.S.length, timeData.afternoon.S.length, timeData.evening.S.length],
        backgroundColor: "#087E8B", 
        borderColor: "#087E8B",
        borderWidth: 1,
        foodDetails: [timeData.morning.S, timeData.afternoon.S, timeData.evening.S]
      },
      {
        label: "P Foods (Proteins)",
        data: [timeData.morning.P.length, timeData.afternoon.P.length, timeData.evening.P.length],
        backgroundColor: "#2C2C2C",
        borderColor: "#2C2C2C", 
        borderWidth: 1,
        foodDetails: [timeData.morning.P, timeData.afternoon.P, timeData.evening.P]
      }
    ];
    
    // Add conflict overlay if needed
    const conflictData = [timeData.morning.conflicts.length, timeData.afternoon.conflicts.length, timeData.evening.conflicts.length];
    
    if (conflictData.some(count => count > 0)) {
      datasets.push({
        label: "⚠️ S+P Conflicts",
        data: conflictData,
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        borderColor: "#FF0000",
        borderWidth: 2,
        type: 'bar',
        foodDetails: [timeData.morning.conflicts, timeData.afternoon.conflicts, timeData.evening.conflicts]
      });
    }
    
    dailyCombinationChartInstance = new Chart(combinationCtx, {
      type: "bar",
      data: {
        labels: ["Morning", "Afternoon", "Evening"],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        scales: {
          x: { title: { display: true, text: "Time of Day" }},
          y: { beginAtZero: true, title: { display: true, text: "Number of Foods" }, max: 10 }
        },
        plugins: {
          legend: { display: true, position: "top", labels: { padding: 20, usePointStyle: true }},
          title: { display: true, text: `Daily Food Combinations - ${today}`, font: { size: 16 }},
          tooltip: {
            callbacks: {
              title: (context) => {
                const timePeriod = context[0].label;
                return `${timePeriod} - ${today}`;
              },
              label: (context) => {
                const datasetIndex = context.datasetIndex;
                const pointIndex = context.dataIndex;
                const dataset = context.chart.data.datasets[datasetIndex];
                const foodDetails = dataset.foodDetails[pointIndex];
                
                if (!foodDetails || foodDetails.length === 0) {
                  return `${dataset.label}: No foods logged`;
                }
                
                return `${dataset.label}: ${foodDetails.length} food${foodDetails.length === 1 ? '' : 's'}`;
              },
              afterLabel: (context) => {
                const datasetIndex = context.datasetIndex;
                const pointIndex = context.dataIndex;
                const dataset = context.chart.data.datasets[datasetIndex];
                const foodDetails = dataset.foodDetails[pointIndex];
                
                if (!foodDetails || foodDetails.length === 0) return null;
                
                const foodList = foodDetails.map(food => {
                  let timeStr = '';
                  if (food.timestamp && food.timestamp !== 'No time recorded') {
                    try {
                      timeStr = new Date(food.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                    } catch (e) {
                      timeStr = food.timestamp;
                    }
                  }
                  return `• ${food.name} ${timeStr ? `(${timeStr})` : ''} ${food.sick ? '🤢' : '🥳'}`;
                }).join('\n');
                
                return foodList;
              }
            }
          }
        },
        layout: { padding: { bottom: 20 }}
      }
    });
  }
}

// =======================
// WELCOME POPUP FUNCTIONALITY
// =======================
function checkWelcomePopup() {
  // Check if welcome popup has been shown before
  const welcomeFlag = localStorage.getItem("welcomeShown");
  console.log("Welcome flag from localStorage:", welcomeFlag);
  
  // TEMPORARILY FORCE POPUP TO SHOW FOR DEBUGGING
  welcomeShown = false; // Force to false to always show popup
  console.log("Welcome shown status (forced):", welcomeShown);
  
  if (!welcomeShown) {
    console.log("Showing welcome popup...");
    showWelcomePopup();
    // Don't set localStorage yet so we can test multiple times
    // localStorage.setItem("welcomeShown", "true");
  } else {
    console.log("Welcome popup already shown, skipping...");
  }
}

function checkBPReminder() {
  // Get the date from the most recent entry (the one just added)
  if (foodEntries.length === 0) return;
  
  const lastEntry = foodEntries[foodEntries.length - 1];
  const entryDate = lastEntry.date;
  
  console.log("Checking BP reminder for date:", entryDate);
  
  const entriesForDate = foodEntries.filter(entry => entry.date === entryDate);
  const bpEntriesForDate = entriesForDate.filter(entry => entry.bps);
  
  console.log("All food entries:", foodEntries);
  console.log(`Entries for ${entryDate}:`, entriesForDate);
  console.log(`BP entries for ${entryDate}:`, bpEntriesForDate);
  console.log(`Food entries count for ${entryDate}:`, entriesForDate.length);
  console.log(`BP entries count for ${entryDate}:`, bpEntriesForDate.length);
  
  // Check if already shown for this specific date
  const bpReminderShownForDate = localStorage.getItem(`bpReminderShown_${entryDate}`);
  console.log(`BP reminder already shown for ${entryDate}?`, bpReminderShownForDate);
  
  // Show BP popup reminder if user has made 2+ entries for this date AND no BP entered
  if (entriesForDate.length >= 2 && bpEntriesForDate.length === 0) {
    console.log("CONDITIONS MET: Showing BP reminder popup for", entryDate);
    showBPReminderPopup(entryDate);
  } else {
    console.log("CONDITIONS NOT MET - entries:", entriesForDate.length, "BP entries:", bpEntriesForDate.length);
  }
}

function showBPReminderPopup(date) {
  // Check if BP reminder was already shown today
  const bpReminderShownForDate = localStorage.getItem(`bpReminderShown_${date}`);
  
  console.log("Checking if BP reminder popup should show...");
  console.log(`BP reminder already shown for ${date}?`, bpReminderShownForDate);
  
  if (!bpReminderShownForDate) {
    const popup = document.getElementById('bpReminderOnlyPopup');
    console.log("BP reminder popup element found:", !!popup);
    if (popup) {
      popup.style.display = 'block';
      console.log("BP reminder popup displayed!");
      // Mark as shown for today
      localStorage.setItem(`bpReminderShown_${date}`, 'true');
    } else {
      console.error("BP reminder popup element not found!");
    }
  } else {
    console.log("BP reminder already shown for this date, skipping...");
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
    const today = new Date().toLocaleDateString();
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

function closeBPReminderOnlyPopup() {
  const popup = document.getElementById('bpReminderOnlyPopup');
  if (popup) {
    popup.style.display = 'none';
  }
}

function handleBPReminderGotIt() {
  closeBPReminderOnlyPopup();
  // Mark welcome as shown permanently
  localStorage.setItem("welcomeShown", "true");
}

function handleSkipBPToday() {
  closeBPReminderOnlyPopup();
  // Mark welcome as shown permanently
  localStorage.setItem("welcomeShown", "true");
}
