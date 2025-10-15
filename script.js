// Debug: Check if script is loading
console.log(" Food Tracker script loading...");

// =======================
// GLOBAL VARIABLES
// =======================
let foodEntries = [];
let favoriteFoods = [];
let bpLineChartInstance = null;
let dailyCombinationChartInstance = null;
let bpReminderShown = false;
let welcomeShown = false;
let bpReadings = JSON.parse(localStorage.getItem('bpReadings')) || [];
let bsReadings = JSON.parse(localStorage.getItem('bsReadings')) || [];

// Food category timing tracking
let lastSFoodTime = JSON.parse(localStorage.getItem('lastSFoodTime')) || null;
let lastPFoodTime = JSON.parse(localStorage.getItem('lastPFoodTime')) || null;

// =======================
// FOOD CATEGORIZATION SYSTEM
// Based on "The Eat Out Guide" from Rachelstea.com
// W + S = OK, W + P = OK, S + P = NO WAY
// =======================

// W Foods (Vegetables, healthy fats, seasonings)
const W_FOODS = [
  'artichoke', 'asparagus', 'broccoli', 'brussels sprouts', 'butter', 'cabbage', 'cauliflower', 'celery', 'cilantro', 'cucumber', 'eggplant', 'fats', 'oils', 'garlic', 'green beans', 'green peppers', 'herbs', 'leafy greens', 'lettuce', 'mayonnaise', 'mushroom', 'okra', 'olives', 'olive oil', 'onions', 'seasonings', 'sprouts', 'greens', 'tomato', 'vegetables oil', 'vinegar', 'wheat grass', 'yellow mustard', 'zucchini'
];

// S Foods (Starches, sugars, fruits)
const S_FOODS = [
  'acorn squash', 'agave', 'all bread', 'bagel', 'bread', 'almond flour', 'avocado', 'beans', 'beets', 'butternut squash', 'cake', 'candy', 'coconut', 'coconut milk', 'crackers', 'dried fruit', 'ice cream', 'carrots', 'chickpeas', 'chocolate', 'corn', 'cornbread', 'lentils', 'lime', 'fruits', 'fruit juice', 'grains', 'honey', 'honey mustard', 'ketchup', 'legumes', 'lemon', 'lima beans', 'nutella', 'orange peppers', 'parsnips', 'pasta', 'peas', 'pickle relish', 'potatoes', 'potato chips', 'pretzels', 'rice', 'rice milk', 'rutabaga', 'sauerkraut', 'sugar', 'tortillas', 'tortilla chips', 'turnips', 'vegetable broth', 'water chestnuts', 'wheat', 'wine', 'winter squash', 'yams'
];

// P Foods (Proteins)
const P_FOODS = [
  'cheese', 'eggs', 'fish', 'pork', 'beef', 'lamb', 'seafood', 'meat broth', 'seeds', 'vegan cheese', 'cheese spread', 'nacho cheese', 'nuts', 'venison', 'processed slices', 'poultry', 'chicken', 'turkey', 'salmon', 'tuna', 'shrimp', 'crab', 'milk', 'yogurt', 'tofu', 'tempeh', 'protein powder'
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

// Function to check food category timing (3-hour rule)
function checkFoodTiming(categories) {
  const now = new Date();
  const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  
  const hasS = categories.includes('S');
  const hasP = categories.includes('P');
  
  // Check if trying to eat S food too soon after P food
  if (hasS && lastPFoodTime) {
    const lastPTime = new Date(lastPFoodTime);
    const timeSinceP = now - lastPTime;
    
    if (timeSinceP < threeHours) {
      const waitUntil = new Date(lastPTime.getTime() + threeHours);
      const remainingTime = waitUntil - now;
      return {
        allowed: false,
        conflictType: 'S after P',
        lastFoodTime: lastPTime,
        waitUntil: waitUntil,
        remainingMs: remainingTime
      };
    }
  }
  
  // Check if trying to eat P food too soon after S food
  if (hasP && lastSFoodTime) {
    const lastSTime = new Date(lastSFoodTime);
    const timeSinceS = now - lastSTime;
    
    if (timeSinceS < threeHours) {
      const waitUntil = new Date(lastSTime.getTime() + threeHours);
      const remainingTime = waitUntil - now;
      return {
        allowed: false,
        conflictType: 'P after S',
        lastFoodTime: lastSTime,
        waitUntil: waitUntil,
        remainingMs: remainingTime
      };
    }
  }
  
  return { allowed: true };
}

// Function to update food category timestamps
function updateFoodTimestamps(categories) {
  const now = new Date().toISOString();
  
  if (categories.includes('S')) {
    lastSFoodTime = now;
    localStorage.setItem('lastSFoodTime', JSON.stringify(now));
  }
  
  if (categories.includes('P')) {
    lastPFoodTime = now;
    localStorage.setItem('lastPFoodTime', JSON.stringify(now));
  }
}

// Line 136: Function to check if food combinations are safe and timed correctly
function checkFoodCombinationAndTiming(categories) {
  const combinationResult = checkFoodCombination(categories);
  const timingResult = checkFoodTiming(categories);
  
  console.log('🔍 Line 140: Timing check results:', {
    combinationResult,
    timingResult,
    categories,
    lastSFoodTime,
    lastPFoodTime
  });
  
  if (!combinationResult.safe) {
    console.log('❌ Line 148: Regular S+P combination detected');
    return { safe: false, warning: combinationResult.warning, timingInfo: null };
  }
  
  if (!timingResult.allowed) {
    console.log('⏰ Line 154: TIMING CONFLICT detected - should show timer!');
    return { 
      safe: false, 
      warning: `Wait ${Math.floor(timingResult.remainingMs / 1000 / 60)} minutes before eating ${timingResult.conflictType}`,
      timingInfo: timingResult
    };
  }
  
  console.log('✅ Line 162: Food combination and timing both OK');
  return { safe: true, warning: null, timingInfo: null };
}

// Function to check if food combinations are safe and timed correctly
function analyzeFoodText(foodText) {
  const components = dishToComponents(foodText);
  const categories = componentsToCategories(components);
  const combo = checkFoodCombinationAndTiming(categories);
  
 if (combo.safe) {
  updateFoodTimestamps(categories);
  console.log('✅ Timestamps updated - food allowed');
 } else {
  console.log('⏰ Timestamps NOT updated - showing warning/timer');
 }

 return { components, categories, combo};
 
}

// =======================
// COMPOUND FOOD DETECTION SYSTEM (DISH SOLVER)
// =======================

// Synonyms mapping - maps alternative names to standard ingredients
const SYNONYMS = {
  'roll': 'bread',
  'bun': 'bread', 
  'wrap': 'tortilla',
  'tortilla': 'bread',
  'crust': 'bread',
  'dough': 'bread',
  'noodle': 'pasta',
  'noodles': 'pasta',
  'spaghetti': 'pasta',
  'macaroni': 'pasta',
  'penne': 'pasta',
  'linguine': 'pasta',
  'burger': 'beef',
  'patty': 'beef',
  'steak': 'beef',
  'chicken': 'poultry',
  'turkey': 'poultry',
  'ham': 'pork',
  'bacon': 'pork',
  'sausage': 'pork',
  'pepperoni': 'pork',
  'tuna': 'fish',
  'salmon': 'fish',
  'shrimp': 'seafood',
  'crab': 'seafood'
};

// Common dish templates - maps dish names to their components
const DISH_TEMPLATES = {
  'grilled cheese': ['bread', 'cheese'],
  'grilled cheese sandwich': ['bread', 'cheese'],
  'cheeseburger': ['bread', 'beef', 'cheese'],
  'hamburger': ['bread', 'beef'],
  'turkey sandwich': ['bread', 'turkey'],
  'ham sandwich': ['bread', 'ham'],
  'tuna sandwich': ['bread', 'tuna'],
  'chicken sandwich': ['bread', 'chicken'],
  'blt': ['bread', 'bacon', 'lettuce', 'tomato'],
  'pizza': ['crust', 'cheese'],
  'pepperoni pizza': ['crust', 'cheese', 'pepperoni'],
  'mac and cheese': ['pasta', 'cheese'],
  'macaroni and cheese': ['pasta', 'cheese'],
  'spaghetti and meatballs': ['pasta', 'beef'],
  'chicken and rice': ['rice', 'chicken'],
  'fish and chips': ['fish', 'potato'],
  'burrito': ['tortilla', 'beans', 'cheese'],
  'quesadilla': ['tortilla', 'cheese'],
  'taco': ['tortilla', 'beef', 'cheese'],
  'pbj': ['bread', 'peanut butter'],
  'peanut butter and jelly': ['bread', 'peanut butter'],
  'club sandwich': ['bread', 'turkey', 'bacon', 'cheese'],
  'reuben': ['bread', 'beef', 'cheese'],
  'philly cheesesteak': ['bread', 'beef', 'cheese'],
  'chicken parmesan': ['chicken', 'cheese', 'pasta'],
  'lasagna': ['pasta', 'cheese', 'beef'],
  'enchiladas': ['tortilla', 'cheese', 'chicken'],
  'nachos': ['chips', 'cheese'],
  'loaded baked potato': ['potato', 'cheese', 'bacon'],
  'shepherd\'s pie': ['potato', 'beef'],
  'fish tacos': ['tortilla', 'fish'],
  'chicken quesadilla': ['tortilla', 'chicken', 'cheese']
};

// Keywords that imply starch presence
const IMPLIED_STARCH = ['sandwich', 'burger', 'sub', 'hoagie', 'wrap', 'burrito', 'taco', 'quesadilla', 'pizza', 'pasta', 'noodle'];

// Keywords that imply protein presence  
const IMPLIED_PROTEIN = ['burger', 'chicken', 'turkey', 'beef', 'pork', 'fish', 'seafood', 'meat', 'protein'];

// Normalize text for analysis
function normalize(text) {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

// Expand synonyms in a word
function expandSynonyms(word) {
  return SYNONYMS[word] || word;
}

// Convert dish name to component foods
function dishToComponents(foodText) {
  const normalized = normalize(foodText);
  const components = [];
  
  // Check exact dish template matches first
  if (DISH_TEMPLATES[normalized]) {
    return DISH_TEMPLATES[normalized].map(expandSynonyms);
  }
  
  // Check partial matches for dish templates (with word boundaries to avoid false matches)
  for (const [dish, ingredients] of Object.entries(DISH_TEMPLATES)) {
    // Only match if it's a complete word or phrase, not a substring
    const dishWords = dish.split(' ');
    const normalizedWords = normalized.split(' ');
    
    // For multi-word dishes, check if all words are present
    if (dishWords.length > 1 && dishWords.every(word => normalizedWords.includes(word))) {
      return ingredients.map(expandSynonyms);
    }
    // For single-word dishes, only match if the input has multiple words
    else if (dishWords.length === 1 && normalizedWords.length > 1 && normalizedWords.includes(dish)) {
      return ingredients.map(expandSynonyms);
    }
  }
  
  // Parse individual words and expand synonyms
  const words = normalized.split(' ');
  words.forEach(word => {
    const expanded = expandSynonyms(word);
    if (expanded !== word || 
        W_FOODS.includes(word) || 
        S_FOODS.includes(word) || 
        P_FOODS.includes(word)) {
      components.push(expanded);
    }
  });
  
  // Check for implied ingredients based on keywords
  IMPLIED_STARCH.forEach(keyword => {
    if (normalized.includes(keyword) && !components.some(c => S_FOODS.includes(c))) {
      components.push('bread'); // Default starch
    }
  });
  
  IMPLIED_PROTEIN.forEach(keyword => {
    if (normalized.includes(keyword) && !components.some(c => P_FOODS.includes(c))) {
      if (keyword === 'chicken') components.push('chicken');
      else if (keyword === 'turkey') components.push('turkey');  
      else if (keyword === 'beef' || keyword === 'burger') components.push('beef');
      else if (keyword === 'fish') components.push('fish');
      else components.push('protein'); // Generic protein
    }
  });
  
  // If no components found, return the original food as a single component
  if (components.length === 0) {
    components.push(foodText.toLowerCase());
  }
  
  return [...new Set(components)]; // Remove duplicates
}

// Convert components to W/S/P categories
function componentsToCategories(components) {
  return components.map(component => {
    if (W_FOODS.some(wFood => component.includes(wFood) || wFood.includes(component))) {
      return 'W';
    }
    if (S_FOODS.some(sFood => component.includes(sFood) || sFood.includes(component))) {
      return 'S';
    }
    if (P_FOODS.some(pFood => component.includes(pFood) || pFood.includes(component))) {
      return 'P';
    }
    return 'W'; // Default to neutral if unknown
  });
}

// =======================
// ENHANCED INPUT VALIDATION SYSTEM (ChatGPT-5 Hardened)
// =======================

// ---- Normalizer: crushes case, accents, separators, and leetspeak ----
function normalizeForFilter(input) {
  return input
    .normalize('NFKD')                // split accents from letters
    .replace(/\p{M}/gu, '')           // drop diacritics
    .toLowerCase()
    // common leetspeak swaps
    .replace(/[@]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[\u{1F4A9}]/gu, 'poop') // 💩 -> "poop"
    // collapse any separators (spaces, punctuation, underscores, emojis, etc.)
    .replace(/[^a-z0-9]/g, '');       // FIXED: only keep letters and numbers
}

// ---- Word roots (comprehensive list) ----
// Hard block: direct scat/bodily waste + inappropriate content
const STRICT_ROOTS = [
  // Bodily waste slang (original list)
  'poop','poo','poopy','poopie','poophead','poopyhead','poopin',
  'dookie','doodoo','doo','dump','dumps','dumping','turd','turds',
  'crap','crappy','stool','stools','deuce','deuces','caca','kaka',
  'bm','number2','no2','fudgedragon','fudgelog', 
  
  // Urine-related
  'pee','pees','peeing','wee','weewee','piss','pissing','tinkle','tinkling',
  'yellowriver','yellowstream',
  
  // Other bodily functions
  'fart','farts','farting','toot','toots','shart','sharts','sharting',
  'skidmark','skidmarks','blowout','blowout',
  
  // Additional inappropriate terms your friend used
  'pussy','ass','asses','butt','butthole','dick','cock','penis',
  'vagina','boob','boobs','tit','tits','fuck','shit','bitch', 'koon',
  'papeh', 'sodomize',
  
  // NEW: Explicit sexual terms (your friend's latest attempts)
  'sodomize','sodomizing','sodomy','ejaculate','ejaculating','ejaculation',
  'blowjob','blow','oral','fellatio','cunnilingus','masturbate','masturbating',
  'orgasm','climax','cum','cumming','jizz','sperm','semen','horny',
  'sex','sexual','sexy','erotic','porn','pornography','nude','naked',
  'intercourse','penetrate','penetrating','penetration','thrust','thrusting'
];

// Soft flag: might need context review (legitimate foods that could be misused)
const SOFT_ROOTS = [
  'gas','gassy','brownie','brownies','log','logs','nugget','nuggets',
  'cream','creamy','sausage','wiener','nuts','melons'
];

// Build fast regexes (after normalization we match contiguous roots)
const strictRe = new RegExp(`(?:${STRICT_ROOTS.join('|')})`, 'i');
const softRe   = new RegExp(`(?:${SOFT_ROOTS.join('|')})`, 'i');

// ---- Main validation check ----
function isValidFoodEntry(foodText) {
  if (!foodText || typeof foodText !== 'string') return false;
  
  console.log('🔍 isValidFoodEntry() called with:', foodText);
  const normalized = normalizeForFilter(foodText);
  console.log('🔄 Normalized text:', normalized);
  console.log('🎯 Testing against strictRe:', strictRe);
  
  // Check strict blocking
  const strictMatch = strictRe.test(normalized);
  console.log('🚨 Strict regex test result:', strictMatch);
  if (strictMatch) {
    const matchedWord = normalized.match(strictRe)[0];
    console.log(`🚫 Blocked entry: "${foodText}" → normalized: "${normalized}" → hit: "${matchedWord}"`);
    return false;
  }
  
  // For now, allow soft matches (could add context checking later)
  const softMatch = softRe.test(normalized);
  console.log('⚠️ Soft regex test result:', softMatch);
  if (softMatch) {
    const matchedWord = normalized.match(softRe)[0];
    console.log(`⚠️ Soft flag: "${foodText}" → normalized: "${normalized}" → hit: "${matchedWord}"`);
    // For now, allow these but log them
    return true;
  }
  
  console.log('✅ No matches found - entry is valid');
  return true;
}

// Show custom message for blocked entries
function showBlockedEntryMessage() {
  // Remove any existing validation modal
  const existingModal = document.getElementById('validationModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create beautiful validation modal
  const modal = document.createElement('div');
  modal.id = 'validationModal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="warning-modal validation-modal">
      <div class="warning-header">
        <div class="warning-icon">⚠️</div>
        <h3 id="validationTitle">Invalid Entry</h3>
      </div>
      <div class="warning-content">
        <p class="warning-message">
          <strong>Please enter a valid food item. Inappropriate or non-food entries are not allowed.</strong>
        </p>
      </div>
      <div class="warning-actions">
        <button id="validationOkBtn" class="warning-btn primary">Understood</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Set up close button handler
  const okBtn = modal.querySelector('#validationOkBtn');
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// =======================
// DOM READY EVENT LISTENER
// =======================
document.addEventListener('DOMContentLoaded', function() {
  console.log(" DOM Content Loaded - Setting up app...");
  
  try {
    // Set today's date as default
    const today = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
    const dateInput = document.getElementById("dateInput");
    if (dateInput) {
      dateInput.value = today;
      console.log(` Set default date to: ${today}`);
    }
    
    // Load existing data
    loadFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up health chips
    setupHealthChips();
    
    // Set up daily notes
    setupDailyNotes();
    
    // Check for welcome popup (only show once)
    checkWelcomePopup();
    
    // Check BP reminder
    checkBPReminder();
    
    // Update charts with existing data
    updateCharts(foodEntries);
    
    // Generate AI suggestions
    generateAISuggestions(foodEntries);
    
    console.log(" App initialized successfully!");
    
  } catch (error) {
    console.error(" Error during app initialization:", error);
  }
});

// =======================
// EVENT LISTENERS SETUP
// =======================
function setupEventListeners() {
  try {
    console.log(" Setting up event listeners...");
    
    // Food form submission
    const foodForm = document.getElementById('foodForm');
    if (foodForm) {
      foodForm.addEventListener('submit', handleAddLog);
    }
    
    // Add log button (since form might not have submit event)
    const addLogBtn = document.getElementById('addLogButton');
    if (addLogBtn) {
      console.log('✅ Line 247: Found Add Entry button, attaching handleAddLog listener');
      addLogBtn.addEventListener('click', handleAddLog);
    } else {
      console.error('❌ Line 250: Add Entry button NOT FOUND! ID: addLogButton');
    }
    
    // Filter buttons
    const allBtn = document.getElementById('allBtn');
    const sickBtn = document.getElementById('sickBtn');
    const okayBtn = document.getElementById('okayBtn');
    
    if (allBtn) allBtn.addEventListener('click', () => filterEntries('all'));
    if (sickBtn) sickBtn.addEventListener('click', () => filterEntries('sick'));
    if (okayBtn) okayBtn.addEventListener('click', () => filterEntries('okay'));
    
    // Export button
    const exportBtn = document.getElementById('exportEncryptedButton');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExportEncrypted);
    }
    
    // Vitals buttons
    const logBPBtn = document.getElementById('logBPButton');
    const logBSBtn = document.getElementById('logBSButton');
    
    console.log('🔍 Vitals buttons found:', { logBPBtn: !!logBPBtn, logBSBtn: !!logBSBtn });
    
    if (logBPBtn) {
      logBPBtn.addEventListener('click', () => {
        console.log('📈 BP button clicked!');
        showBPModal();
      });
      console.log('✅ BP button event listener added');
    } else {
      console.error('❌ BP button not found!');
    }
    
    if (logBSBtn) {
      logBSBtn.addEventListener('click', () => {
        console.log('🔊 BS button clicked!');
        showBSModal();
      });
      console.log('✅ BS button event listener added');
    } else {
      console.error('❌ BS button not found!');
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearAllButton');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllEntries);
    }
    
    // Welcome popup close button
    const closePopupBtn = document.getElementById('closePopupBtn');
    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', closeBPReminderPopup);
    }
    
    // BP reminder popup close button
    const closeBPBtn = document.getElementById('closeBPBtn');
    if (closeBPBtn) {
      closeBPBtn.addEventListener('click', closeBPReminderPopup);
    }
    
    // Welcome popup buttons (actual IDs from HTML)
    const getStartedBtn = document.getElementById('addBpNow');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', closeBPReminderPopup);
    }
    
    const skipTodayBtn = document.getElementById('skipToday');
    if (skipTodayBtn) {
      skipTodayBtn.addEventListener('click', closeBPReminderPopup);
    }
    
    const closeBpPopupBtn = document.getElementById('closeBpPopup');
    if (closeBpPopupBtn) {
      closeBpPopupBtn.addEventListener('click', closeBPReminderPopup);
    }
    
    // Collapsible sections for graphs and other content
    const collapsibles = document.querySelectorAll('.collapsible');
    console.log(` Found ${collapsibles.length} collapsible sections`);
    
    collapsibles.forEach((collapsible, index) => {
      console.log(` Setting up collapsible ${index}: ${collapsible.textContent.trim()}`);
      
      collapsible.addEventListener('click', function() {
        console.log(` Clicked collapsible: ${this.textContent.trim()}`);
        
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        
        if (content) {
          console.log(` Found content element:`, content);
          
          // Special handling for health content (uses CSS classes)
          if (content.classList.contains('health-content')) {
            content.classList.toggle('active');
            if (content.classList.contains('active')) {
              console.log(` Expanded health section: ${this.textContent.trim()}`);
              // Set up health chips when health section opens
              setTimeout(() => {
                setupHealthChips();
              }, 100);
            } else {
              console.log(` Collapsed health section: ${this.textContent.trim()}`);
            }
          } else {
            // Regular collapsible sections (use display toggle)
            if (content.style.display === 'block') {
              content.style.display = 'none';
              console.log(` Collapsed section: ${this.textContent.trim()}`);
            } else {
              content.style.display = 'block';
              console.log(` Expanded section: ${this.textContent.trim()}`);
              
              // If this is a chart section that just opened, update charts
              const canvas = content.querySelector('canvas');
              if (canvas) {
                console.log(` Found canvas in section, updating charts...`);
                // Small delay to ensure the canvas is visible before drawing
                setTimeout(() => {
                  updateCharts(foodEntries);
                }, 100);
              }
            }
          }
        } else {
          console.warn(` No content element found for: ${this.textContent.trim()}`);
        }
      });
    });
    
    console.log(" Event listeners set up successfully!");
    
  } catch (error) {
    console.error(" Error setting up event listeners:", error);
  }
}

// =======================
// INITIAL LOAD FUNCTIONS
// =======================
function loadFromStorage() {
  try {
    console.log(" Loading data from storage...");
    
    const storedEntries = localStorage.getItem("foodEntries");
    if (storedEntries) {
      foodEntries = JSON.parse(storedEntries);
      
      // Re-analyze existing entries with compound food detection
      foodEntries.forEach(entry => {
        if (!entry.analysis) {
          entry.analysis = analyzeFoodText(entry.food);
        }
      });
      
      console.log(` Loaded ${foodEntries.length} food entries`);
    }
    
    const storedFavorites = localStorage.getItem("favoriteFoods");
    if (storedFavorites) {
      favoriteFoods = JSON.parse(storedFavorites);
      renderFavorites(); // Display the favorites
      console.log(` Loaded ${favoriteFoods.length} favorite foods`);
    }
    
    // Render all entries after loading
    renderAllEntries();
    
  } catch (error) {
    console.error(" Error loading from storage:", error);
  }
}

// =======================
// EVENT HANDLERS
// =======================
function handleAddLog(event) {
  try {
    console.log('🚀 Line 427: handleAddLog CALLED! Event:', event);
    console.log('📝 Line 428: handleAddLog start');
    event.preventDefault();
    const food = document.getElementById("foodInput").value.trim();
    if (!food) return alert("Please enter a food item.");
    
    console.log('🔍 VALIDATION CHECK: About to validate food:', food);
    if (!isValidFoodEntry(food)) {
      console.log('❌ VALIDATION FAILED: Calling showBlockedEntryMessage()');
      showBlockedEntryMessage();
      return;
    }
    console.log('✅ VALIDATION PASSED: Food entry is valid');
    
   
    // Capture health details from text fields and radio buttons
    const selectedExercise = [];
    const selectedStressRelief = [];
    const selectedSymptoms = [];
    
    // Get radio button states
    const exercisedRadio = document.querySelector('input[name="exercised"]:checked');
    const stressReliefRadio = document.querySelector('input[name="stressRelief"]:checked');
    const symptomsRadio = document.querySelector('input[name="symptoms"]:checked');
    
    //////////////////
    //Get text field values
    const exerciseInput = document.querySelector('#exerciseInput .health-text-field');
    const stressInput = document.querySelector('#stressInput .health-text-field');
    const symptomsInput = document.querySelector('#symptomsInput .health-text-field');

    //Parse text field values (user needs comma for multiple entry items)
if (exerciseInput && exerciseInput.value.trim()) {
  const exercises = exerciseInput.value.split(',').map(item => item.trim()).filter(item => item);
  selectedExercise.push(...exercises);
}

if (stressInput && stressInput.value.trim()) {
  const stressActivities = stressInput.value.split(',').map(item => item.trim()).filter(item => item);
  selectedStressRelief.push(...stressActivities);
}

if (symptomsInput && symptomsInput.value.trim()) {
  const symptoms = symptomsInput.value.split(',').map(item => item.trim()).filter(item => item);
  selectedSymptoms.push(...symptoms);
}

// Derive final radio values: if text is entered, force 'yes'
const exercisedValue = selectedExercise.length > 0 ? 'yes' : (exercisedRadio?.value || 'no');
const stressReliefValue = selectedStressRelief.length > 0 ? 'yes' : (stressReliefRadio?.value || 'no');
const symptomsValue = selectedSymptoms.length > 0 ? 'yes' : (symptomsRadio?.value || 'no');
    
    // If a radio is yes but array empty, add placeholder to preserve intent
    if (exercisedValue === 'yes' && selectedExercise.length === 0) selectedExercise.push('Yes (unspecified)');
    if (stressReliefValue === 'yes' && selectedStressRelief.length === 0) selectedStressRelief.push('Yes (unspecified)');
    if (symptomsValue === 'yes' && selectedSymptoms.length === 0) selectedSymptoms.push('Yes (unspecified)');
    
    console.log('Health data captured (finalized):', {
      exercised: exercisedValue,
      exercise: selectedExercise,
      stressRelief: stressReliefValue,
      stressReliefActivities: selectedStressRelief,
      symptoms: symptomsValue,
      symptomsList: selectedSymptoms
    });
    
    
    const newEntry = {
      food,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toLocaleString(),
      sick: document.getElementById("sickInput").checked,
      mealType: document.getElementById("mealTypeInput").value || "Unspecified",
      healthDetails: {
        exercised: exercisedValue,
        exercise: selectedExercise,
        stressRelief: stressReliefValue,
        stressReliefActivities: selectedStressRelief,
        symptoms: symptomsValue,
        symptomsList: selectedSymptoms
      }
    };

    // Use compound food analysis
    const analysis = analyzeFoodText(newEntry.food);
    newEntry.analysis = analysis;
    
    console.log('🔍 Line 498: Analysis results for warning check:', {
      food: newEntry.food,
      analysis: analysis,
      comboSafe: analysis.combo.safe,
      comboWarning: analysis.combo.warning,
      timingInfo: analysis.combo.timingInfo
    });
    
    if (!analysis.combo.safe) {
      console.log('🚨 Line 502: TRIGGERING WARNING MODAL!');
      showWarningModal(analysis.combo.warning, analysis.components, analysis.combo.timingInfo);
    } else {
      console.log('✅ Line 505: No warning needed - combo is safe');
    }

    foodEntries.push(newEntry);
    localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
    
    // Clear form and health text fields
document.getElementById("foodInput").value = "";
document.getElementById("sickInput").checked = false;

// Clear health text fields
const exerciseField = document.querySelector('#exerciseInput .health-text-field');
const stressField = document.querySelector('#stressInput .health-text-field');
const symptomsField = document.querySelector('#symptomsInput .health-text-field');

if (exerciseField) exerciseField.value = '';
if (stressField) stressField.value = '';
if (symptomsField) symptomsField.value = '';
    
    renderAllEntries();
    updateCharts(foodEntries);
    
    console.log(" Entry added successfully with health details!");
    
  } catch (error) {
    console.error(" Error adding entry:", error);
  }
}

function renderAllEntries() {
  try {
    const list = document.getElementById("foodLogList");
    if (!list) return;
    
    list.innerHTML = "";
    
    // Sort entries by date (newest first) but keep track of original indices
    const entriesWithIndex = foodEntries.map((entry, index) => ({ entry, originalIndex: index }));
    const sortedEntries = entriesWithIndex.sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date));
    
    sortedEntries.forEach(({ entry, originalIndex }) => renderEntry(entry, originalIndex));
    
    console.log(` Rendered ${sortedEntries.length} entries`);
    
  } catch (error) {
    console.error(" Error rendering entries:", error);
  }
}

function renderEntry(entry, index) {
  try {
    const li = document.createElement("li");
    li.className = "food-entry";
    
    // Add meal type emoji
    let mealEmoji = '';
    switch(entry.mealType.toLowerCase()) {
      case 'breakfast': mealEmoji = '🍳'; break;
      case 'lunch': mealEmoji = '🥪'; break;
      case 'dinner': mealEmoji = '🍽️'; break;
      case 'snack': mealEmoji = '🍿'; break;
      case 'drinks': mealEmoji = '☕'; break;
      case 'dessert': mealEmoji = '🍰'; break;
      default: mealEmoji = '🍴'; break;
    }
    
    const detected = entry.analysis && entry.analysis.components && entry.analysis.components.length
      ? `<br><small style="color:#666;font-size:.8rem;"> Detected: ${entry.analysis.components.join(', ')}</small>`
      : '';

    li.innerHTML = `
      <div class="entry-content">
        <strong>${entry.date}</strong> - ${entry.food} (${mealEmoji} ${entry.mealType})
        ${entry.timestamp ? `<br><small style="color:#666;font-size:.8rem;"> ${entry.timestamp}</small>` : ''}
        ${detected}
        ${entry.sick ? " Felt Sick" : " Felt Okay"}
      </div>
      <div class="entry-actions">
        <button class="edit-btn" onclick="editEntry(${index})" title="Edit entry">✏️</button>
        <button class="favorite-btn" onclick="toggleFavorite('${entry.food}')" title="Add to favorites">⭐</button>
        <button class="delete-btn" onclick="deleteEntry(${index})" title="Delete entry">✕</button>
      </div>
    `;
    
    document.getElementById("foodLogList").appendChild(li);
  } catch (error) {
    console.error(" Error rendering entry:", error);
  }
}

function deleteEntry(index) {
  try {
    if (confirm("Are you sure you want to delete this entry?")) {
      foodEntries.splice(index, 1);
      localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
      renderAllEntries();
      updateCharts(foodEntries);
    }
  } catch (error) {
    console.error(" Error deleting entry:", error);
  }
}

// Edit Entry Functions (Requests #1 & #6)
let currentEditIndex = null;

function editEntry(index) {
  try {
    currentEditIndex = index;
    const entry = foodEntries[index];
    
    // Convert timestamp to datetime-local format
    let datetimeValue = '';
    if (entry.timestamp) {
      try {
        const date = new Date(entry.timestamp);
        datetimeValue = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch (e) {
        console.error('Error parsing timestamp:', e);
      }
    }
    
    // Pre-fill the modal fields
    document.getElementById('editTimestamp').value = datetimeValue;
    
    // Pre-fill health details if they exist
    const hd = entry.healthDetails || {};
    const exerciseList = Array.isArray(hd.exercise) ? hd.exercise : [];
    const stressList = Array.isArray(hd.stressReliefActivities) ? hd.stressReliefActivities : [];
    const symptomsList = Array.isArray(hd.symptomsList) ? hd.symptomsList : [];
    
    document.getElementById('editExercise').value = exerciseList.join(', ');
    document.getElementById('editStressRelief').value = stressList.join(', ');
    document.getElementById('editSymptoms').value = symptomsList.join(', ');
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Set up event listeners
    document.getElementById('saveEditBtn').onclick = saveEditedEntry;
    document.getElementById('cancelEditBtn').onclick = closeEditModal;
    
    console.log(` Editing entry ${index}:`, entry);
    
  } catch (error) {
    console.error(" Error opening edit modal:", error);
  }
}

function saveEditedEntry() {
  try {
    if (currentEditIndex === null) return;
    
    const entry = foodEntries[currentEditIndex];
    
    // Update timestamp
    const newTimestamp = document.getElementById('editTimestamp').value;
    if (newTimestamp) {
      entry.timestamp = new Date(newTimestamp).toLocaleString();
      entry.date = new Date(newTimestamp).toLocaleDateString();
    }
    
    // Update health details
    const exerciseText = document.getElementById('editExercise').value.trim();
    const stressText = document.getElementById('editStressRelief').value.trim();
    const symptomsText = document.getElementById('editSymptoms').value.trim();
    
    // Parse comma-separated values
    const exerciseList = exerciseText ? exerciseText.split(',').map(item => item.trim()).filter(item => item) : [];
    const stressList = stressText ? stressText.split(',').map(item => item.trim()).filter(item => item) : [];
    const symptomsList = symptomsText ? symptomsText.split(',').map(item => item.trim()).filter(item => item) : [];
    
    // Update health details object
    entry.healthDetails = {
      exercised: exerciseList.length > 0 ? 'yes' : 'no',
      exercise: exerciseList,
      stressRelief: stressList.length > 0 ? 'yes' : 'no',
      stressReliefActivities: stressList,
      symptoms: symptomsList.length > 0 ? 'yes' : 'no',
      symptomsList: symptomsList
    };
    
    // Save to localStorage
    localStorage.setItem('foodEntries', JSON.stringify(foodEntries));
    
    // Re-render entries
    renderAllEntries();
    updateCharts(foodEntries);
    
    // Close modal
    closeEditModal();
    
    console.log(' Entry updated successfully!');
    
  } catch (error) {
    console.error(" Error saving edited entry:", error);
  }
}

function closeEditModal() {
  try {
    document.getElementById('editModal').style.display = 'none';
    currentEditIndex = null;
    
    // Clear form fields
    document.getElementById('editTimestamp').value = '';
    document.getElementById('editExercise').value = '';
    document.getElementById('editStressRelief').value = '';
    document.getElementById('editSymptoms').value = '';
    
  } catch (error) {
    console.error(" Error closing edit modal:", error);
  }
}

// =======================
// DAILY NOTES FUNCTIONS
// =======================

// Storage key for daily notes
const NOTES_STORAGE_KEY = 'dailyNotes';

// Load notes from localStorage
function loadDailyNotes() {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error(' Error loading daily notes:', error);
    return {};
  }
}

// Save notes to localStorage
function saveDailyNotes(notesData) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesData));
    console.log(' Daily notes saved successfully');
  } catch (error) {
    console.error(' Error saving daily notes:', error);
  }
}

// Initialize daily notes
function setupDailyNotes() {
  try {
    const notesDateInput = document.getElementById('notesDate');
    const notesTextarea = document.getElementById('dailyNotesText');
    const saveBtn = document.getElementById('saveNotesBtn');
    const clearBtn = document.getElementById('clearNotesBtn');
    const savedIndicator = document.getElementById('notesSavedIndicator');
    
    if (!notesDateInput || !notesTextarea) {
      console.error('Daily notes elements not found');
      return;
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    notesDateInput.value = today;
    
    // Load notes for today
    loadNotesForDate(today);
    
    // Date change listener
    notesDateInput.addEventListener('change', function() {
      loadNotesForDate(this.value);
      hideSavedIndicator();
    });
    
    // Save button listener
    saveBtn.addEventListener('click', function() {
      const date = notesDateInput.value;
      const notes = notesTextarea.value.trim();
      
      if (!date) {
        alert('Please select a date');
        return;
      }
      
      const allNotes = loadDailyNotes();
      
      if (notes) {
        allNotes[date] = {
          date: date,
          notes: notes,
          lastModified: new Date().toISOString()
        };
      } else {
        // If notes are empty, remove the entry
        delete allNotes[date];
      }
      
      saveDailyNotes(allNotes);
      
      // Clear the textarea after saving
      notesTextarea.value = '';
      
      showSavedIndicator();
      renderSavedNotesList();
      
      console.log(` Notes saved for ${date}`);
    });
    
    // Clear button listener
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear notes for this date?')) {
        notesTextarea.value = '';
        const date = notesDateInput.value;
        const allNotes = loadDailyNotes();
        delete allNotes[date];
        saveDailyNotes(allNotes);
        hideSavedIndicator();
        renderSavedNotesList();
      }
    });
    
    // Setup collapsible
    const collapsible = document.querySelector('.notes-collapsible');
    if (collapsible) {
      collapsible.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.display === 'block') {
          content.style.display = 'none';
        } else {
          content.style.display = 'block';
        }
      });
    }
    
    console.log(' Daily notes setup complete');
    
    // Initial render of saved notes list
    renderSavedNotesList();
    
  } catch (error) {
    console.error(' Error setting up daily notes:', error);
  }
}

// Render the list of all saved notes
function renderSavedNotesList() {
  try {
    const container = document.getElementById('savedNotesContainer');
    const title = document.querySelector('.saved-notes-title');
    
    if (!container) return;
    
    const allNotes = loadDailyNotes();
    const notesArray = Object.values(allNotes).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (notesArray.length === 0) {
      container.innerHTML = '';
      if (title) title.style.display = 'none';
      return;
    }
    
    // Show title
    if (title) title.style.display = 'block';
    
    // Render each note as a collapsible item
    container.innerHTML = notesArray.map((note, index) => {
      const lastSaved = note.lastModified ? new Date(note.lastModified).toLocaleString() : 'Unknown';
      
      return `
        <div class="saved-note-item" data-note-date="${note.date}">
          <div class="saved-note-header" onclick="toggleSavedNote('${note.date}')">
            <div class="saved-note-info">
              <strong>📄 ${note.date}</strong>
              <small class="saved-note-time">Saved: ${lastSaved}</small>
            </div>
            <span class="saved-note-toggle" id="toggle-${note.date.replace(/\//g, '-')}">▼</span>
          </div>
          <div class="saved-note-content" id="content-${note.date.replace(/\//g, '-')}" style="display: none;">
            <p class="saved-note-text">${note.notes}</p>
            <div class="saved-note-actions">
              <button class="note-action-btn edit-btn" onclick="editSavedNote('${note.date}')">✏️ Edit</button>
              <button class="note-action-btn delete-btn" onclick="deleteSavedNote('${note.date}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error(' Error rendering saved notes list:', error);
  }
}

// Toggle expand/collapse of a saved note
function toggleSavedNote(date) {
  const contentId = `content-${date.replace(/\//g, '-')}`;
  const toggleId = `toggle-${date.replace(/\//g, '-')}`;
  const content = document.getElementById(contentId);
  const toggle = document.getElementById(toggleId);
  
  if (content && toggle) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '▲';
    } else {
      content.style.display = 'none';
      toggle.textContent = '▼';
    }
  }
}

// Edit a saved note
function editSavedNote(date) {
  try {
    const notesDateInput = document.getElementById('notesDate');
    const notesTextarea = document.getElementById('dailyNotesText');
    
    if (notesDateInput && notesTextarea) {
      notesDateInput.value = date;
      loadNotesForDate(date);
      notesTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notesTextarea.focus();
    }
  } catch (error) {
    console.error(' Error editing note:', error);
  }
}

// Delete a saved note
function deleteSavedNote(date) {
  try {
    if (confirm(`Delete note for ${date}?`)) {
      const allNotes = loadDailyNotes();
      delete allNotes[date];
      saveDailyNotes(allNotes);
      renderSavedNotesList();
      
      const notesDateInput = document.getElementById('notesDate');
      if (notesDateInput && notesDateInput.value === date) {
        document.getElementById('dailyNotesText').value = '';
      }
    }
  } catch (error) {
    console.error(' Error deleting note:', error);
  }
}

// Load notes for a specific date
function loadNotesForDate(date) {
  try {
    const allNotes = loadDailyNotes();
    const notesTextarea = document.getElementById('dailyNotesText');
    
    if (allNotes[date]) {
      notesTextarea.value = allNotes[date].notes;
      console.log(` Loaded notes for ${date}`);
    } else {
      notesTextarea.value = '';
      console.log(` No notes found for ${date}`);
    }
  } catch (error) {
    console.error(' Error loading notes for date:', error);
  }
}

// Show saved indicator
function showSavedIndicator() {
  const indicator = document.getElementById('notesSavedIndicator');
  if (indicator) {
    indicator.style.display = 'block';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
}

// Hide saved indicator
function hideSavedIndicator() {
  const indicator = document.getElementById('notesSavedIndicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function toggleFavorite(foodName) {
  try {
    // Create a favorite object with food name and current date
    const today = new Date().toLocaleDateString();
    const favoriteItem = {
      food: foodName,
      date: today
    };
    
    // Check if this food is already favorited
    const existingFavorite = favoriteFoods.find(fav => 
      (typeof fav === 'string' ? fav : fav.food) === foodName
    );
    
    if (!existingFavorite) {
      favoriteFoods.push(favoriteItem);
      localStorage.setItem("favoriteFoods", JSON.stringify(favoriteFoods));
      renderFavorites(); // Update the favorites display
      alert(`"${foodName}" added to favorites! ⭐`);
    } else {
      alert(`"${foodName}" is already in your favorites!`);
    }
  } catch (error) {
    console.error(" Error adding to favorites:", error);
  }
}

function renderFavorites() {
  try {
    const favoritesList = document.getElementById("favoritesList");
    if (!favoritesList) return;
    
    favoritesList.innerHTML = "";
    
    if (favoriteFoods.length === 0) {
      favoritesList.innerHTML = "<li>No favorite foods yet. Click ⭐ on any food entry to add it!</li>";
      return;
    }
    
    favoriteFoods.forEach((favorite, index) => {
      const li = document.createElement("li");
      li.className = "favorite-item";
      
      // Handle both old string format and new object format
      const foodName = typeof favorite === 'string' ? favorite : favorite.food;
      const favoriteDate = typeof favorite === 'string' ? 'Added previously' : favorite.date;
      
      li.innerHTML = `
        <div class="favorite-content">
          <span class="favorite-food">${foodName}</span>
          <small class="favorite-date">Added: ${favoriteDate}</small>
        </div>
        <button class="remove-favorite-btn" onclick="removeFavorite(${index})" title="Remove from favorites">✕</button>
      `;
      favoritesList.appendChild(li);
    });
    
    console.log(` Rendered ${favoriteFoods.length} favorite foods`);
    
  } catch (error) {
    console.error(" Error rendering favorites:", error);
  }
}

function removeFavorite(index) {
  try {
    favoriteFoods.splice(index, 1);
    localStorage.setItem("favoriteFoods", JSON.stringify(favoriteFoods));
    renderFavorites();
  } catch (error) {
    console.error(" Error removing favorite:", error);
  }
}

function clearAllEntries() {
  try {
    if (confirm("Are you sure you want to clear all entries?")) {
      foodEntries = [];
      localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
      renderAllEntries();
      updateCharts(foodEntries);
    }
  } catch (error) {
    console.error(" Error clearing entries:", error);
  }
}

function filterEntries(filter) {
  try {
    const list = document.getElementById("foodLogList");
    list.innerHTML = "";

    let filteredEntries = foodEntries;
    if (filter === 'sick') {
      filteredEntries = foodEntries.filter(entry => entry.sick);
    } else if (filter === 'okay') {
      filteredEntries = foodEntries.filter(entry => !entry.sick);
    }

    // Keep track of original indices when filtering
    const entriesWithIndex = filteredEntries.map(entry => {
      const originalIndex = foodEntries.indexOf(entry);
      return { entry, originalIndex };
    });
    
    entriesWithIndex.sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date));
    entriesWithIndex.forEach(({ entry, originalIndex }) => renderEntry(entry, originalIndex));
  } catch (error) {
    console.error(" Error filtering entries:", error);
  }
}

function updateCharts(logs) {
  try {
    console.log(" Updating charts...");
    if (!logs || logs.length === 0) {
      console.log("No data to display in charts");
      return;
    }
    
    // Update BP Line Chart
    updateBPLineChart(logs);
    
    // Update Daily Combination Bar Chart
    updateDailyCombinationChart(logs);
    
    console.log(" Charts updated!");
  } catch (error) {
    console.error(" Error updating charts:", error);
  }
}

function updateBPLineChart(logs) {
  try {
    const bpCtx = document.getElementById('bpLineChart');
    if (!bpCtx) return;
    
    // Destroy existing chart
    if (bpLineChartInstance) {
      bpLineChartInstance.destroy();
    }
    
    // Use the new BP readings data instead of food entry BP data
    console.log(` Found ${bpReadings.length} BP readings:`, bpReadings);
    
    if (bpReadings.length === 0) {
      console.log("No BP data to display");
      return;
    }
    
    // Sort BP readings by date
    const sortedBPReadings = [...bpReadings].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    const labels = sortedBPReadings.map(reading => reading.date);
    const bpData = sortedBPReadings.map(reading => {
      // Parse BP value (e.g., "120/80" -> 120 for systolic)
      const bpParts = reading.value.split('/');
      return bpParts.length >= 1 ? parseInt(bpParts[0]) : null;
    }).filter(val => val !== null);
    
    console.log(" BP Chart Data:", { labels, bpData });
    
    bpLineChartInstance = new Chart(bpCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Systolic BP',
          data: bpData,
          borderColor: 'rgba(231, 76, 60, 1)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(231, 76, 60, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Blood Pressure Trend',
            font: { size: 16, weight: 'bold' },
            color: '#2C2C2C'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 80,
            max: 200,
            title: {
              display: true,
              text: 'Systolic Pressure (mmHg)',
              font: { weight: 'bold' }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date',
              font: { weight: 'bold' }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    });
    
    console.log(" BP Line Chart updated successfully!");
  } catch (error) {
    console.error(" Error updating BP line chart:", error);
  }
}

function updateDailyCombinationChart(logs) {
  try {
    const combinationCtx = document.getElementById('dailyCombinationChart');
    if (!combinationCtx) return;
    
    // Destroy existing chart
    if (dailyCombinationChartInstance) {
      dailyCombinationChartInstance.destroy();
    }
    
    // Get today's entries
    const today = new Date().toLocaleDateString();
    const todayEntries = logs.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    if (todayEntries.length === 0) {
      console.log("No food entries for today");
      return;
    }
    
    // Categorize by time periods
    const timePeriods = {
      'Morning': [],
      'Afternoon': [],
      'Evening': []
    };
    
    todayEntries.forEach(entry => {
      const analysis = analyzeFoodText(entry.food);
      
      // Determine time period from actual timestamp, not meal type
      let timePeriod = 'Morning';
      if (entry.timestamp) {
        try {
          const date = new Date(entry.timestamp);
          const hour = date.getHours();
          
          if (hour >= 5 && hour < 12) {
            timePeriod = 'Morning';
          } else if (hour >= 12 && hour < 17) {
            timePeriod = 'Afternoon';
          } else {
            timePeriod = 'Evening';
          }
        } catch (e) {
          console.error('Error parsing timestamp for chart:', e);
          // Fallback to meal type if timestamp parse fails
          const mealType = (entry.mealType || 'breakfast').toLowerCase();
          if (mealType === 'lunch' || mealType === 'snack') {
            timePeriod = 'Afternoon';
          } else if (mealType === 'dinner') {
            timePeriod = 'Evening';
          }
        }
      } else {
        // Fallback to meal type if no timestamp
        const mealType = (entry.mealType || 'breakfast').toLowerCase();
        if (mealType === 'lunch' || mealType === 'snack') {
          timePeriod = 'Afternoon';
        } else if (mealType === 'dinner') {
          timePeriod = 'Evening';
        }
      }
      
      timePeriods[timePeriod].push({
        name: entry.food,
        categories: analysis.categories,
        hasConflict: analysis.categories.includes('S') && analysis.categories.includes('P'),
        timestamp: entry.timestamp || 'No time recorded',
        sick: entry.sick
      });
    });
    
    // Create datasets
    const datasets = [
      {
        label: 'W (Neutral)',
        data: [0, 0, 0],
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        foodDetails: [[], [], []]
      },
      {
        label: 'S (Starch)',
        data: [0, 0, 0],
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        foodDetails: [[], [], []]
      },
      {
        label: 'P (Protein)',
        data: [0, 0, 0],
        backgroundColor: 'rgba(155, 89, 182, 0.8)',
        foodDetails: [[], [], []]
      },
      {
        label: 'S+P Conflict',
        data: [0, 0, 0],
        backgroundColor: 'rgba(231, 76, 60, 0.9)',
        foodDetails: [[], [], []]
      }
    ];
    
    // Populate data
    Object.keys(timePeriods).forEach((period, periodIndex) => {
      const foods = timePeriods[period];
      
      foods.forEach(food => {
        if (food.hasConflict) {
          datasets[3].data[periodIndex]++;
          datasets[3].foodDetails[periodIndex].push(food);
        } else if (food.categories.includes('S')) {
          datasets[1].data[periodIndex]++;
          datasets[1].foodDetails[periodIndex].push(food);
        } else if (food.categories.includes('P')) {
          datasets[2].data[periodIndex]++;
          datasets[2].foodDetails[periodIndex].push(food);
        } else {
          datasets[0].data[periodIndex]++;
          datasets[0].foodDetails[periodIndex].push(food);
        }
      });
    });
    
    dailyCombinationChartInstance = new Chart(combinationCtx, {
      type: 'bar',
      data: {
        labels: ['Morning', 'Afternoon', 'Evening'],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        scales: {
          x: { 
            title: { display: true, text: 'Time of Day' }
          },
          y: { 
            beginAtZero: true, 
            title: { display: true, text: 'Number of Foods' },
            max: 10 
          }
        },
        plugins: {
          legend: { 
            display: true, 
            position: 'top',
            labels: { 
              padding: 20, 
              usePointStyle: true 
            }
          },
          title: { 
            display: true, 
            text: `Daily Food Combinations - ${today}`,
            font: { size: 16 }
          },
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
                  return `• ${food.name} ${timeStr ? `(${timeStr})` : ''} ${food.sick ? ' ' : ' '}`;
                }).join('\n');
                
                return foodList;
              }
            }
          }
        },
        layout: { 
          padding: { bottom: 20 }
        }
      }
    });
    
  } catch (error) {
    console.error(" Error updating combination chart:", error);
  }
}

function generateAISuggestions(entries) {
  try {
    console.log(" Generating AI suggestions...");
    
    const aiSuggestionsDiv = document.getElementById('aiSuggestions');
    if (!aiSuggestionsDiv) return;
    
    if (!entries || entries.length === 0) {
      aiSuggestionsDiv.innerHTML = '<p>Add some food entries to get personalized health insights!</p>';
      return;
    }
    
    // Analyze recent entries (last 7 days)
    const recentEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const sickEntries = recentEntries.filter(entry => entry.sick);
    const conflictEntries = recentEntries.filter(entry => {
      const analysis = analyzeFoodText(entry.food);
      return analysis.categories.includes('S') && analysis.categories.includes('P');
    });
    
    let suggestions = [];
    
    // Generate suggestions based on patterns
    if (sickEntries.length > 0) {
      const commonSickFoods = sickEntries.map(entry => entry.food);
      suggestions.push(` You've felt sick after eating: ${commonSickFoods.slice(0, 3).join(', ')}. Consider avoiding these foods.`);
    }
    
    if (conflictEntries.length > 0) {
      suggestions.push(` You've had ${conflictEntries.length} S+P combinations recently. Try separating starches and proteins by 3+ hours.`);
    }
    
    if (recentEntries.length > 0) {
      const wFoods = recentEntries.filter(entry => {
        const analysis = analyzeFoodText(entry.food);
        return analysis.categories.includes('W') && !entry.sick;
      });
      
      if (wFoods.length > 0) {
        suggestions.push(` Great choices: ${wFoods.slice(0, 2).map(e => e.food).join(', ')} - these neutral foods work well with everything!`);
      }
    }
    
    // Default suggestions if no patterns found
    if (suggestions.length === 0) {
      suggestions = [
        " Try adding more neutral (W) foods like leafy greens and vegetables",
        " Remember to separate starches and proteins by 3+ hours",
        " Keep tracking to identify your personal food patterns"
      ];
    }
    
    // Display suggestions in a styled container
    aiSuggestionsDiv.innerHTML = `
      <div class="ai-suggestions-container">
        <h3> AI Health Insights</h3>
        <div class="suggestions-list">
          ${suggestions.map(suggestion => `<div class="suggestion-item">${suggestion}</div>`).join('')}
        </div>
      </div>
    `;
    
    console.log(" AI suggestions generated!");
    
  } catch (error) {
    console.error(" Error generating AI suggestions:", error);
  }
}

function generateHealthReport() {
  const today = new Date().toLocaleDateString();
  
  // Analyze food patterns
  const totalEntries = foodEntries.length;
  const sickEntries = foodEntries.filter(entry => entry.sick).length;
  const conflictEntries = foodEntries.filter(entry => {
    const analysis = analyzeFoodText(entry.food);
    return analysis.categories.includes('S') && analysis.categories.includes('P');
  }).length;
  
  // Get recent entries (last 7 days)
  const recentEntries = foodEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  // BP data
  const bpEntries = foodEntries.filter(entry => entry.bps && entry.bps !== 'null' && entry.bps !== null);
  
  // Collect health details from entries
  const healthDetails = {
    exercise: [],                 // [{date, activity, timestamp}]
    stressRelief: [],             // [{date, activity, timestamp}]
    symptoms: [],                 // [{date, symptom, timestamp}]
    totalHealthEntries: 0
  };
  
  foodEntries.forEach(entry => {
    if (entry.healthDetails) {
      const hd = entry.healthDetails;
      let addedAny = false;
      
      // Normalize arrays
      const exerciseList = Array.isArray(hd.exercise) ? hd.exercise : (Array.isArray(hd.exerciseActivities) ? hd.exerciseActivities : []);
      const stressList = Array.isArray(hd.stressReliefActivities) ? hd.stressReliefActivities : [];
      const symList = Array.isArray(hd.symptomsList) ? hd.symptomsList : (Array.isArray(hd.symptoms) ? hd.symptoms : []);
      
      const exercisedYes = (hd.exercised || '').toLowerCase() === 'yes';
      const stressYes = (hd.stressRelief || '').toLowerCase() === 'yes';
      const symptomsYes = (hd.symptoms || '').toLowerCase() === 'yes';
      
      // Collect exercise activities (or placeholder)
      if (exerciseList.length > 0) {
        exerciseList.forEach(activity => {
          healthDetails.exercise.push({ date: entry.date, activity, timestamp: entry.timestamp });
        });
        console.log('Agg: exercise push -> len =', healthDetails.exercise.length);
        addedAny = true;
      } else if (exercisedYes) {
        healthDetails.exercise.push({ date: entry.date, activity: 'Yes (unspecified)', timestamp: entry.timestamp });
        console.log('Agg: exercise YES placeholder -> len =', healthDetails.exercise.length);
        addedAny = true;
      }
      
      // Collect stress relief activities (or placeholder)
      if (stressList.length > 0) {
        stressList.forEach(activity => {
          healthDetails.stressRelief.push({ date: entry.date, activity, timestamp: entry.timestamp });
        });
        console.log('Agg: stress push -> len =', healthDetails.stressRelief.length);
        addedAny = true;
      } else if (stressYes) {
        healthDetails.stressRelief.push({ date: entry.date, activity: 'Yes (unspecified)', timestamp: entry.timestamp });
        console.log('Agg: stress YES placeholder -> len =', healthDetails.stressRelief.length);
        addedAny = true;
      }
      
      // Collect symptoms (or placeholder)
      if (symList.length > 0) {
        symList.forEach(symptom => {
          healthDetails.symptoms.push({ date: entry.date, symptom, timestamp: entry.timestamp });
        });
        console.log('Agg: symptoms push -> len =', healthDetails.symptoms.length);
        addedAny = true;
      } else if (symptomsYes) {
        healthDetails.symptoms.push({ date: entry.date, symptom: 'Yes (unspecified)', timestamp: entry.timestamp });
        console.log('Agg: symptoms YES placeholder -> len =', healthDetails.symptoms.length);
        addedAny = true;
      }
      
      if (addedAny) healthDetails.totalHealthEntries++;
    }
  });
  // Post-aggregation final lengths
  console.log('HealthDetails final:', {
    exercise: healthDetails.exercise.length,
    stressRelief: healthDetails.stressRelief.length,
    symptoms: healthDetails.symptoms.length,
    totalHealthEntries: healthDetails.totalHealthEntries
  });
  
  // Load daily notes
  const dailyNotes = loadDailyNotes();
  const notesArray = Object.values(dailyNotes).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    generatedDate: today,
    totalEntries,
    sickEntries,
    conflictEntries,
    recentEntries: recentEntries.length,
    bpEntries: bpEntries.length,
    entries: foodEntries,
    favorites: favoriteFoods,
    healthDetails,
    dailyNotes: notesArray
  };
}

function createHTMLReport(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <header style="text-align: center; border-bottom: 2px solid #087E8B; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #087E8B; margin: 0;"> Personal Health Report</h1>
            <p style="color: #666; margin: 5px 0;">Generated: ${data.generatedDate}</p>
            <p style="color: #666; margin: 5px 0;">Total Entries: ${data.totalEntries}</p>
        </header>

        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> Health Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0; color: #28a745;"> Felt Good</h3>
                    <p style="font-size: 24px; margin: 5px 0; font-weight: bold;">${data.totalEntries - data.sickEntries}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0; color: #dc3545;"> Felt Sick</h3>
                    <p style="font-size: 24px; margin: 5px 0; font-weight: bold;">${data.sickEntries}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0; color: #fd7e14;"> S+P Conflicts</h3>
                    <p style="font-size: 24px; margin: 5px 0; font-weight: bold;">${data.conflictEntries}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0; color: #6f42c1;"> BP Readings</h3>
                    <p style="font-size: 24px; margin: 5px 0; font-weight: bold;">${data.bpEntries}</p>
                </div>
            </div>
        </section>

        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> Food Entries</h2>
            ${data.entries.map(entry => `
                <div style="background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid ${entry.sick ? '#dc3545' : '#28a745'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong>${entry.date}</strong> - ${entry.food} (${entry.mealType})
                            ${entry.timestamp ? `<br><small style="color:#666;font-size:.8rem;"> ${entry.timestamp}</small>` : ''}
                            ${entry.analysis && entry.analysis.components ? `<br><small style="color: #666;"> Detected: ${entry.analysis.components.join(', ')}</small>` : ''}
                            <br>${entry.sick ? " Felt Sick" : " Felt Okay"}
                        </div>
                    </div>
                </div>
            `).join('')}
        </section>

        ${bpReadings.length > 0 ? `
        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> 📈 Blood Pressure Readings</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                ${bpReadings.map(bp => `
                    <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #e74c3c;">
                        <strong style="color: #e74c3c;">${bp.date}</strong> - ${bp.value}
                        ${bp.timestamp ? `<br><small style="color: #666;"> ${bp.timestamp}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${bsReadings.length > 0 ? `
        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> 🔊 Bowel Sounds Readings</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                ${bsReadings.map(bs => `
                    <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #8B9467;">
                        <strong style="color: #8B9467;">${bs.date}</strong> - Level ${bs.value}/7
                        ${bs.timestamp ? `<br><small style="color: #666;"> ${bs.timestamp}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${(data.healthDetails.exercise.length + data.healthDetails.stressRelief.length + data.healthDetails.symptoms.length) > 0 ? `
        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> Health Details</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h3 style="margin: 0; color: #28a745;"> Exercise</h3>
                ${data.healthDetails.exercise.map(ex => `
                    <div style="margin: 5px 0;">
                        <strong>${ex.date}</strong> - ${ex.activity}
                        ${ex.timestamp ? `<br><small style="color: #666;"> ${ex.timestamp}</small>` : ''}
                    </div>
                `).join('')}
                
                <h3 style="margin-top: 15px; color: #17a2b8;"> Stress Relief</h3>
                ${data.healthDetails.stressRelief.map(sr => `
                    <div style="margin: 5px 0;">
                        <strong>${sr.date}</strong> - ${sr.activity}
                        ${sr.timestamp ? `<br><small style="color: #666;"> ${sr.timestamp}</small>` : ''}
                    </div>
                `).join('')}
                
                <h3 style="margin-top: 15px; color: #dc3545;"> Symptoms</h3>
                ${data.healthDetails.symptoms.map(sym => `
                    <div style="margin: 5px 0;">
                        <strong>${sym.date}</strong> - ${sym.symptom}
                        ${sym.timestamp ? `<br><small style="color: #666;"> ${sym.timestamp}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${data.favorites.length > 0 ? `
        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;"> Favorite Foods</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                ${data.favorites.map(fav => {
                    const foodName = typeof fav === 'string' ? fav : fav.food;
                    const favoriteDate = typeof fav === 'string' ? 'Added previously' : fav.date;
                    return `<div style="margin: 5px 0;"> ${foodName} <small style="color: #666;">(Added: ${favoriteDate})</small></div>`;
                }).join('')}
            </div>
        </section>
        ` : ''}
        
        ${data.dailyNotes && data.dailyNotes.length > 0 ? `
        <section style="margin-bottom: 30px;">
            <h2 style="color: #087E8B; border-bottom: 1px solid #ddd; padding-bottom: 5px;">📝 Daily Notes</h2>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                ${data.dailyNotes.map(note => `
                    <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #087E8B;">
                        <strong style="color: #087E8B;">${note.date}</strong>
                        <p style="margin: 10px 0 0 0; color: #333; white-space: pre-wrap;">${note.notes}</p>
                        ${note.lastModified ? `<small style="color: #999;">Last updated: ${new Date(note.lastModified).toLocaleString()}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <p>This report was generated by your Personal Food Tracker app.</p>
            <p><strong>Keep this information confidential and share only with trusted healthcare providers.</strong></p>
        </footer>
    </div>
  `;
}

function handleExportEncrypted() {
  try {
    if (foodEntries.length === 0) {
      alert("No food entries to export. Add some entries first!");
      return;
    }

    // Show the export modal instead of using prompt
    showExportModal();

  } catch (error) {
    console.error(" Error in export:", error);
    alert("Error creating export. Please try again.");
  }
}

function showExportModal() {
  // Create modal HTML
  const modalHTML = `
    <div id="exportModal" class="export-modal-overlay">
      <div class="export-modal-content">
        <div class="export-modal-header">
          <h2> Export Password</h2>
        </div>
        
        <div class="export-modal-body">
          <p class="export-description">Create a password to protect your medical data:</p>
          <p class="export-subdescription"><strong>Your doctor will need this password to view the report.</strong></p>
          
          <div class="password-section">
            <label for="exportPassword" class="password-label">Password:</label>
            <div class="password-input-container">
              <input type="password" id="exportPassword" class="export-password-input" placeholder="Enter password (6+ characters)" />
              <button type="button" class="password-toggle" onclick="togglePasswordVisibility()">
                <span id="passwordToggleIcon">&#128274;</span>
              </button>
            </div>
          </div>
          
          <div class="remember-checkbox">
            <input type="checkbox" id="rememberPassword" class="remember-checkbox-input" />
            <label for="rememberPassword" class="remember-label">Remember this password for future exports</label>
          </div>
        </div>
        
        <div class="export-modal-actions">
          <button id="createReportBtn" class="create-report-btn">&#128275; Create Health Report</button>
          <button id="cancelExportBtn" class="cancel-export-btn">Cancel</button>
        </div>
        
        <div class="export-modal-footer">
          <p class="password-note">&#128274; Password is saved locally in your browser for convenience</p>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Load saved password if available
  const savedPassword = localStorage.getItem('exportPassword');
  if (savedPassword) {
    document.getElementById('exportPassword').value = savedPassword;
    document.getElementById('rememberPassword').checked = true;
  }
  
  // Add event listeners
  document.getElementById('createReportBtn').addEventListener('click', processExport);
  document.getElementById('cancelExportBtn').addEventListener('click', closeExportModal);
  document.getElementById('exportPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      processExport();
    }
  });
  
  // Focus on password input
  document.getElementById('exportPassword').focus();
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('exportPassword');
  const toggleIcon = document.getElementById('passwordToggleIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.innerHTML = '&#128275;';
  } else {
    passwordInput.type = 'password';
    toggleIcon.innerHTML = '&#128274;';
  }
}

function processExport() {
  const password = document.getElementById('exportPassword').value;
  const rememberPassword = document.getElementById('rememberPassword').checked;
  
  if (!password || password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }
  
  // Save password if requested
  if (rememberPassword) {
    localStorage.setItem('exportPassword', password);
  } else {
    localStorage.removeItem('exportPassword');
  }
  
  // Close modal
  closeExportModal();
  
  // Continue with export process
  try {
    // Generate comprehensive health report
    const reportData = generateHealthReport();
    
    // One-time export diagnostic to verify health data included
    if (!window.__exportDiagnosticLogged) {
      const hd = reportData.healthDetails || {};
      // Detect entries where radios are YES but no chips selected
      const radioYesNoChips = foodEntries.reduce((acc, e) => {
        const h = e.healthDetails || {};
        if (h.exercised === 'yes' && (!Array.isArray(h.exercise) || h.exercise.length === 0)) acc.exercise++;
        if (h.stressRelief === 'yes' && (!Array.isArray(h.stressReliefActivities) || h.stressReliefActivities.length === 0)) acc.stressRelief++;
        if (h.symptoms === 'yes' && (!Array.isArray(h.symptomsList) || h.symptomsList.length === 0)) acc.symptoms++;
        return acc;
      }, { exercise: 0, stressRelief: 0, symptoms: 0 });
      
      console.group('%c Export Diagnostic','color:#087E8B;font-weight:600;');
      console.log('Total entries:', foodEntries.length);
      console.log('HealthDetails counts:', {
        totalHealthEntries: hd.totalHealthEntries,
        exerciseItems: Array.isArray(hd.exercise) ? hd.exercise.length : 0,
        stressReliefItems: Array.isArray(hd.stressRelief) ? hd.stressRelief.length : 0,
        symptomItems: Array.isArray(hd.symptoms) ? hd.symptoms.length : 0
      });
      console.log('Radios YES with no chips selected:', radioYesNoChips);
      if ((radioYesNoChips.exercise + radioYesNoChips.stressRelief + radioYesNoChips.symptoms) > 0) {
        console.warn('Some entries have radios = YES but no chips selected; these will not appear unless chips are chosen.');
      }
      console.groupEnd();
      window.__exportDiagnosticLogged = true;
    }
     
    // Create HTML report
    const htmlReport = createHTMLReport(reportData);
    
    // Encrypt the report
    const encryptedData = CryptoJS.AES.encrypt(htmlReport, password).toString();
    
    // Create download
    const today = new Date().toISOString().split('T')[0];
    const filename = `Health_Report_${today}.html`;
    
    const exportHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Encrypted Health Report</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .decrypt-container {
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .decrypt-header {
            text-align: center;
            padding: 30px 30px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .decrypt-body {
            padding: 30px;
        }
        
        .decrypt-description {
            font-size: 1.1rem;
            color: #666;
            margin: 0 0 10px 0;
            text-align: center;
        }
        
        .decrypt-subdescription {
            font-size: 1.1rem;
            color: #666;
            margin: 0 0 30px 0;
            text-align: center;
            font-weight: 500;
        }
        
        .password-section {
            margin-bottom: 25px;
        }
        
        .password-label {
            display: block;
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .decrypt-password-input {
            width: 100%;
            padding: 15px 50px 15px 15px;
            font-size: 1.1rem;
            border: 3px solid #ff69b4;
            border-radius: 8px;
            outline: none;
            box-sizing: border-box;
            background: white;
        }
        
        .decrypt-password-input:focus {
            border-color: #ff1493;
            box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
        }
        
        .password-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            font-size: 1.2rem;
        }
        
        .decrypt-actions {
            padding: 0 30px 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .decrypt-btn {
            background: #1e88e5;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .decrypt-btn:hover {
            background: #1565c0;
        }
        
        .decrypt-footer {
            padding: 0 30px 30px;
            text-align: center;
        }
        
        .decrypt-note {
            font-size: 0.9rem;
            color: #999;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        
        .error { 
            color: #dc3545; 
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            text-align: center;
        }
        
        .hidden { display: none; }
        
        .report-content {
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: white;
            min-height: 100vh;
        }
        
        /* Mobile responsiveness */
        @media screen and (max-width: 768px) {
            .decrypt-container {
                width: 95%;
                margin: 20px;
            }
            
            .decrypt-header,
            .decrypt-body,
            .decrypt-actions,
            .decrypt-footer {
                padding-left: 20px;
                padding-right: 20px;
            }
            
            .decrypt-description,
            .decrypt-subdescription {
                font-size: 1rem;
            }
            
            .password-label {
                font-size: 1.1rem;
            }
            
            .decrypt-password-input {
                font-size: 1rem;
                padding: 12px 45px 12px 12px;
            }
        }
    </style>
</head>
<body>
    <div id="decrypt-section">
        <div class="decrypt-container">
            <div class="decrypt-header">
                <h2> Encrypted Health Report</h2>
            </div>
            
            <div class="decrypt-body">
                <p class="decrypt-description">This report contains sensitive health information and is password protected.</p>
                <p class="decrypt-subdescription"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                
                <div class="password-section">
                    <label for="decryptPassword" class="password-label">Enter Password:</label>
                    <div class="password-input-container">
                        <input type="password" id="decryptPassword" class="decrypt-password-input" placeholder="Enter your password" />
                        <button type="button" class="password-toggle" onclick="toggleDecryptPassword()">
                            <span id="decryptToggleIcon">&#128274;</span>
                        </button>
                    </div>
                </div>
                
                <div id="decrypt-error" class="error hidden"></div>
            </div>
            
            <div class="decrypt-actions">
                <button id="decryptBtn" class="decrypt-btn" onclick="decryptReport()">&#128275; Decrypt Report</button>
            </div>
            
            <div class="decrypt-footer">
                <p class="decrypt-note">&#128274; Keep this password safe and confidential</p>
            </div>
        </div>
    </div>
    
    <div id="report-content" class="report-content hidden"></div>
    
    <script>
        const encryptedData = '${encryptedData}';
        
        function toggleDecryptPassword() {
            const passwordInput = document.getElementById('decryptPassword');
            const toggleIcon = document.getElementById('decryptToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.innerHTML = '&#128275;';
            } else {
                passwordInput.type = 'password';
                toggleIcon.innerHTML = '&#128274;';
            }
        }
        
        function decryptReport() {
            const password = document.getElementById('decryptPassword').value;
            const errorDiv = document.getElementById('decrypt-error');
            
            if (!password) {
                errorDiv.textContent = 'Please enter the password.';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            try {
                const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
                const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
                
                if (!decryptedText) {
                    throw new Error('Invalid password');
                }
                
                document.getElementById('decrypt-section').classList.add('hidden');
                document.getElementById('report-content').innerHTML = decryptedText;
                document.getElementById('report-content').classList.remove('hidden');
                document.body.style.background = 'white';
                
            } catch (error) {
                errorDiv.textContent = 'Incorrect password. Please try again.';
                errorDiv.classList.remove('hidden');
            }
        }
        
        document.getElementById('decryptPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                decryptReport();
            }
        });
        
        // Focus on password input when page loads
        document.getElementById('decryptPassword').focus();
    </script>
</body>
</html>`;

    // Download the file
    const blob = new Blob([exportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    alert(` Health report exported successfully!\n\nFile: ${filename}\nPassword: ${password}\n\nKeep your password safe - you'll need it to view the report.`);
    
  } catch (error) {
    console.error(" Error creating export:", error);
    alert("Error creating export. Please try again.");
  }
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.remove();
  }
}

function checkWelcomePopup() {
  try {
    const welcomeShown = localStorage.getItem("welcomeShown");
    
    if (!welcomeShown) {
      showWelcomePopup();
    }
  } catch (error) {
    console.error("Error checking welcome popup:", error);
  }
}

function showWelcomePopup() {
  try {
    const popup = document.getElementById('bpReminderPopup');
    
    if (popup) {
      popup.style.display = 'block';
      
      // Force setup event listeners here to ensure they work
      setupWelcomePopupListeners();
    } else {
      console.error("Welcome popup element not found!");
    }
  } catch (error) {
    console.error("Error showing welcome popup:", error);
  }
}

function setupWelcomePopupListeners() {
  console.log(" Setting up welcome popup event listeners...");
  
  // Get Started button
  const getStartedBtn = document.getElementById('addBpNow');
  if (getStartedBtn) {
    console.log(" Found Get Started button");
    getStartedBtn.onclick = closeBPReminderPopup;
  } else {
    console.error(" Get Started button not found!");
  }
  
  // Skip Today button
  const skipTodayBtn = document.getElementById('skipToday');
  if (skipTodayBtn) {
    console.log(" Found Skip Today button");
    skipTodayBtn.onclick = closeBPReminderPopup;
  } else {
    console.error(" Skip Today button not found!");
  }
  
  // Close button (X)
  const closeBpPopupBtn = document.getElementById('closeBpPopup');
  if (closeBpPopupBtn) {
    console.log(" Found Close button");
    closeBpPopupBtn.onclick = closeBPReminderPopup;
  } else {
    console.error(" Close button not found!");
  }
}

function closeBPReminderPopup() {
  try {
    const popup = document.getElementById('bpReminderPopup');
    
    if (popup) {
      popup.style.display = 'none';
      localStorage.setItem("welcomeShown", "true");
    } else {
      console.error(" Could not find popup to close!");
    }
  } catch (error) {
    console.error("Error closing popup:", error);
  }
}

function checkBPReminder() {
  // Simplified for now
}

function setupHealthChips() {
  try {
    console.log(" Setting up health details...");
    
    // Set up exercise radio buttons with text field visibility
    const exerciseRadios = document.querySelectorAll('input[name="exercised"]');
    const exerciseInput = document.getElementById('exerciseInput');
    
    console.log(`Found ${exerciseRadios.length} exercise radio buttons`);
    console.log('Exercise input element:', exerciseInput);
    
    exerciseRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        console.log(`Exercise radio changed to: ${this.value}`);
        if (this.value === 'yes') {
          if (exerciseInput) {
            exerciseInput.style.display = 'flex';
            console.log('Showing exercise input field');
          }
        } else {
          if (exerciseInput) {
            exerciseInput.style.display = 'none';
            // Clear input field when hiding
            const textField = exerciseInput.querySelector('.health-text-field');
            if (textField) textField.value = '';
            console.log('Hiding exercise input field and clearing value');
          }
        }
        // Auto-update last entry with new health details
        setTimeout(() => updateLastEntryHealthDetails(), 100);
      });
    });
    
    // Set up stress relief radio buttons
    const stressRadios = document.querySelectorAll('input[name="stressRelief"]');
    const stressInput = document.getElementById('stressInput');
    
    console.log(`Found ${stressRadios.length} stress radio buttons`);
    console.log('Stress input element:', stressInput);
    
    stressRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        console.log(`Stress relief radio changed to: ${this.value}`);
        if (this.value === 'yes') {
          if (stressInput) {
            stressInput.style.display = 'flex';
            console.log('Showing stress input field');
          }
        } else {
          if (stressInput) {
            stressInput.style.display = 'none';
            // Clear input field when hiding
            const textField = stressInput.querySelector('.health-text-field');
            if (textField) textField.value = '';
            console.log('Hiding stress input field and clearing value');
          }
        }
        // Auto-update last entry with new health details
        setTimeout(() => updateLastEntryHealthDetails(), 100);
      });
    });
    
    // Set up symptoms radio buttons
    const symptomRadios = document.querySelectorAll('input[name="symptoms"]');
    const symptomsInput = document.getElementById('symptomsInput');
    
    console.log(`Found ${symptomRadios.length} symptom radio buttons`);
    console.log('Symptoms input element:', symptomsInput);
    
    symptomRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        console.log(`Symptoms radio changed to: ${this.value}`);
        if (this.value === 'yes') {
          if (symptomsInput) {
            symptomsInput.style.display = 'flex';
            console.log('Showing symptoms input field');
          }
        } else {
          if (symptomsInput) {
            symptomsInput.style.display = 'none';
            // Clear input field when hiding
            const textField = symptomsInput.querySelector('.health-text-field');
            if (textField) textField.value = '';
            console.log('Hiding symptoms input field and clearing value');
          }
        }
        // Auto-update last entry with new health details
        setTimeout(() => updateLastEntryHealthDetails(), 100);
      });
    });
    
    console.log(" Health details set up successfully!");
  } catch (error) {
    console.error(" Error setting up health details:", error);
  }
}

// Auto-update the last entry's health details when selections change
function updateLastEntryHealthDetails() {
  try {
    if (foodEntries.length === 0) return; // No entries to update
    
    // Get current health selections (same logic as handleAddLog)
    const selectedExercise = [];
    const selectedStressRelief = [];
    const selectedSymptoms = [];
    
    // Get radio button states
    const exercisedRadio = document.querySelector('input[name="exercised"]:checked');
    const stressReliefRadio = document.querySelector('input[name="stressRelief"]:checked');
    const symptomsRadio = document.querySelector('input[name="symptoms"]:checked');
    
    // Get text field values
    const exerciseInput = document.querySelector('#exerciseInput .health-text-field');
    const stressInput = document.querySelector('#stressInput .health-text-field');
    const symptomsInput = document.querySelector('#symptomsInput .health-text-field');
    
    // Parse text field values
    if (exerciseInput && exerciseInput.value.trim()) {
      const exercises = exerciseInput.value.split(',').map(item => item.trim()).filter(item => item);
      selectedExercise.push(...exercises);
    }
    
    if (stressInput && stressInput.value.trim()) {
      const stressActivities = stressInput.value.split(',').map(item => item.trim()).filter(item => item);
      selectedStressRelief.push(...stressActivities);
    }
    
    if (symptomsInput && symptomsInput.value.trim()) {
      const symptoms = symptomsInput.value.split(',').map(item => item.trim()).filter(item => item);
      selectedSymptoms.push(...symptoms);
    }
    
    // Derive final values
    const exercisedValue = selectedExercise.length > 0 ? 'yes' : (exercisedRadio?.value || 'no');
    const stressReliefValue = selectedStressRelief.length > 0 ? 'yes' : (stressReliefRadio?.value || 'no');
    const symptomsValue = selectedSymptoms.length > 0 ? 'yes' : (symptomsRadio?.value || 'no');
    
    // Add placeholders if needed
    if (exercisedValue === 'yes' && selectedExercise.length === 0) selectedExercise.push('Yes (unspecified)');
    if (stressReliefValue === 'yes' && selectedStressRelief.length === 0) selectedStressRelief.push('Yes (unspecified)');
    if (symptomsValue === 'yes' && selectedSymptoms.length === 0) selectedSymptoms.push('Yes (unspecified)');
    
    // Update the last entry
    const lastEntry = foodEntries[foodEntries.length - 1];
    lastEntry.healthDetails = {
      exercised: exercisedValue,
      exercise: selectedExercise,
      stressRelief: stressReliefValue,
      stressReliefActivities: selectedStressRelief,
      symptoms: symptomsValue,
      symptomsList: selectedSymptoms
    };
    
    // Save to localStorage
    localStorage.setItem("foodEntries", JSON.stringify(foodEntries));
    
    console.log(' Auto-updated last entry health details:', lastEntry.healthDetails);
  } catch (error) {
    console.error(' Error updating last entry health details:', error);
  }
}

function showWarningModal(warning, detectedItems, timingInfo) {
  try {
    const modal = document.getElementById('warningModal');
    const detectedItemsSpan = document.getElementById('detectedItems');
    const warningMessageEl = modal.querySelector('#warningMessage');
    const warningTitleEl = modal.querySelector('#warningTitle');
    const timerSection = modal.querySelector('#timerSection');
    
    console.log('✅ Modal created and elements found:', {
      modal: !!modal,
      detectedItemsSpan: !!detectedItemsSpan,
      warningMessageEl: !!warningMessageEl,
      warningTitleEl: !!warningTitleEl,
      timerSection: !!timerSection
    });
    
    // Set the detected items
    detectedItemsSpan.textContent = detectedItems.join(', ');
    
    // Handle timing conflicts vs regular S+P warnings
    if (timingInfo && !timingInfo.allowed) {
      console.log('🕐 Showing timer for timing conflict');
      // This is a timing conflict - show timer
      warningTitleEl.textContent = '⏰ Food Timing Alert';
      warningMessageEl.innerHTML = `
        <strong>Too Soon for This Combination!</strong><br>
        Wait ${Math.ceil(timingInfo.remainingMs / 1000 / 60)} minutes before eating this.
      `;
      
      // Show and set up timer section
      timerSection.style.display = 'block';
      const safeTimeEl = modal.querySelector('#safeTime');
      safeTimeEl.textContent = timingInfo.waitUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      // Start countdown
      startCountdown(modal, timingInfo.waitUntil);
    } else {
      console.log('⚠️ Showing regular S+P warning');
      // Regular S+P warning - hide timer
      warningTitleEl.textContent = 'Food Combination Alert';
      warningMessageEl.innerHTML = `
        <strong>S + P Combination Detected!</strong><br>
        This combination may cause digestive discomfort.
      `;
      timerSection.style.display = 'none';
    }
    
    // Set up close button
    const okBtn = modal.querySelector('#warningOkBtn');
    if (okBtn) {
      okBtn.onclick = () => {
        modal.style.display = 'none';
        modal.remove();
        // Clear any running countdown
        if (modal.countdownInterval) {
          clearInterval(modal.countdownInterval);
        }
      };
    }
    
    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.remove();
        // Clear any running countdown
        if (modal.countdownInterval) {
          clearInterval(modal.countdownInterval);
        }
      }
    };
    
    console.log('🎉 Beautiful modal should now be visible!');
  } catch (error) {
    console.error(' Error showing warning modal:', error);
  }
}

// Function to start and manage the countdown timer
function startCountdown(modal, targetTime) {
  const countdownEl = modal.querySelector('#countdownTime');
  
  // Clear any existing countdown
  if (modal.countdownInterval) {
    clearInterval(modal.countdownInterval);
  }
  
  modal.countdownInterval = setInterval(() => {
    const now = new Date();
    const remaining = targetTime - now;
    
    if (remaining <= 0) {
      // Timer finished!
      countdownEl.textContent = '00:00:00';
      countdownEl.style.color = '#4CAF50'; // Green
      modal.querySelector('#timerMessage').textContent = '✅ You can now safely eat this combination!';
      clearInterval(modal.countdownInterval);
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        modal.style.display = 'none';
        modal.remove();
      }, 3000);
    } else {
      // Update countdown display
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

function closeWarningModal() {
  try {
    const modal = document.getElementById('warningModal');
    if (modal) {
      modal.style.display = 'none';
    }
  } catch (error) {
    console.error(' Error closing warning modal:', error);
  }
}

// Show BP Modal
function showBPModal() {
  const modal = document.getElementById('bpModal');
  const dateTimeInput = document.getElementById('bpDateTime');
  
  // Set current date/time as default
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  dateTimeInput.value = localDateTime;
  
  modal.style.display = 'flex';
  
  // Set up event listeners
  document.getElementById('saveBPBtn').onclick = saveBPReading;
  document.getElementById('cancelBPBtn').onclick = () => modal.style.display = 'none';
  
  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Show BS Modal
function showBSModal() {
  const modal = document.getElementById('bsModal');
  const dateTimeInput = document.getElementById('bsDateTime');
  
  // Set current date/time as default
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  dateTimeInput.value = localDateTime;
  
  modal.style.display = 'flex';
  
  // Set up event listeners
  document.getElementById('saveBSBtn').onclick = saveBSReading;
  document.getElementById('cancelBSBtn').onclick = () => modal.style.display = 'none';
  
  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Save BP Reading
function saveBPReading() {
  const bpValue = document.getElementById('bpInput').value.trim();
  const dateTime = document.getElementById('bpDateTime').value;
  
  if (!bpValue) {
    alert('Please enter a blood pressure reading (e.g., 120/80)');
    return;
  }
  
  if (!dateTime) {
    alert('Please select a date and time');
    return;
  }
  
  // Validate BP format (basic check for numbers/numbers)
  if (!/^\d+\/\d+$/.test(bpValue)) {
    alert('Please enter blood pressure in format: 120/80');
    return;
  }
  
  const bpReading = {
    value: bpValue,
    date: new Date(dateTime).toLocaleDateString(),
    timestamp: new Date(dateTime).toLocaleString(),
    dateTime: dateTime
  };
  
  bpReadings.push(bpReading);
  localStorage.setItem('bpReadings', JSON.stringify(bpReadings));
  
  // Clear form and close modal
  document.getElementById('bpInput').value = '';
  document.getElementById('bpModal').style.display = 'none';
  
  // Update BP chart immediately to show new reading
  updateBPLineChart();
  
  console.log('✅ BP reading saved and chart updated:', bpReading);
}

// Save BS Reading
function saveBSReading() {
  const bsValue = document.getElementById('bsInput').value;
  const dateTime = document.getElementById('bsDateTime').value;
  
  if (!bsValue) {
    alert('Please select a bowel sounds level (1-7)');
    return;
  }
  
  if (!dateTime) {
    alert('Please select a date and time');
    return;
  }
  
  const bsReading = {
    value: bsValue,
    date: new Date(dateTime).toLocaleDateString(),
    timestamp: new Date(dateTime).toLocaleString(),
    dateTime: dateTime
  };
  
  bsReadings.push(bsReading);
  localStorage.setItem('bsReadings', JSON.stringify(bsReadings));
  
  // Clear form and close modal
  document.getElementById('bsInput').value = '';
  document.getElementById('bsModal').style.display = 'none';
  
  console.log('BS reading saved:', bsReading);
}

console.log(" Food Tracker script loaded successfully!");

// =======================
// VITALS MODAL FUNCTIONS
// =======================
