# Food Tracker App
A comprehensive health and nutrition tracking application that helps you understand the relationship between what you eat and how you feel. Built with advanced food categorization, timing rules, and AI-powered insights.

## ✨ Key Features

### 🥗 Smart Food Tracking
- **Intelligent Food Analysis**: Automatically detects compound foods (e.g., "cheeseburger" → bread + beef + cheese)
- **Advanced Input Validation**: Professional content filtering system prevents inappropriate entries
- **Meal Type Classification**: Organize by Breakfast, Lunch, Dinner, Snacks, Dessert
- **Timestamp Tracking**: Precise logging with date and time
- **Sick/Okay Status**: Track how foods make you feel

### 🧬 Food Science Integration
Based on "The Eat Out Guide" nutritional principles:

- **W Foods (Neutral)**: Vegetables, healthy fats, seasonings
- **S Foods (Starches)**: Grains, fruits, sugars, starches  
- **P Foods (Proteins)**: Meat, dairy, nuts, protein sources

**Smart Combination Rules**:
- ✅ **W + S**: Safe combination
- ✅ **W + P**: Safe combination  
- ⚠️ **S + P**: Warning - may cause digestive issues
- ⏰ **3-Hour Rule**: Enforces timing between S and P foods

### 📊 Advanced Analytics
- **Blood Pressure Trends**: Visual line charts tracking BP over time
- **Daily Food Combinations**: Bar charts showing W/S/P distribution by time of day
- **Conflict Detection**: Highlights unsafe S+P combinations with red warnings
- **AI Health Insights**: Pattern recognition for personalized recommendations

### 🏥 Health Monitoring
- **Comprehensive Health Details**: Track exercise, stress relief, symptoms
- **Interactive Chips**: Quick selection for activities and symptoms
- **Blood Pressure Logging**: Dedicated BP tracking with reminders
- **Blood Sugar Scale**: 1-7 rating system for energy levels
- **Calorie Tracking**: Optional calorie logging per entry

### 🔒 Professional Validation System
- **Multi-layer Content Filtering**: Blocks inappropriate entries with professional messaging
- **Leetspeak Detection**: Handles character substitutions (3 → e, @ → a, etc.)
- **Unicode Normalization**: Processes accented characters and emojis
- **Comprehensive Word Lists**: Extensive database of blocked terms

### 🎯 Smart Features
- **Favorites System**: Star foods you enjoy for quick reference
- **Welcome Popup**: Guided onboarding for new users
- **BP Reminders**: Automatic prompts when BP hasn't been logged
- **Collapsible Sections**: Organized UI with expandable content areas
- **Real-time Warnings**: Instant feedback on food combinations and timing

## 🚀 How to Use

### Adding Food Entries
1. Enter food in the main input field
2. Select meal type from dropdown
3. Optionally add blood pressure, calories, and blood sugar rating
4. Expand "Health Details" to log exercise, stress relief, and symptoms
5. Use interactive chips to specify activities
6. Mark if food made you feel sick
7. Click "Add Entry"

### Understanding Warnings
- **Red Warning Modal**: Appears for unsafe S+P combinations
- **Timer Display**: Shows remaining wait time when 3-hour rule is violated
- **Component Detection**: See what ingredients were detected in compound foods

### Viewing Analytics
- **Blood Pressure Trend**: Track BP changes over time
- **Daily Combinations**: See W/S/P distribution throughout the day
- **AI Insights**: Get personalized recommendations based on patterns
- **Conflict Highlighting**: Red bars indicate problematic combinations

### Managing Data
- **Favorites**: Click ⭐ to save preferred foods
- **Export**: Generate encrypted reports for healthcare providers
- **Clear All**: Reset all data (use with caution)
- **Filtering**: View all entries, only sick entries, or only okay entries

## 🔬 Technical Architecture

### Food Analysis Engine
```javascript
// Example: "cheeseburger" analysis
Input: "cheeseburger"
→ Components: ["bread", "beef", "cheese"]  
→ Categories: ["S", "P", "P"]
→ Warning: "S + P combination detected!"
```

### Validation System
- **Normalization**: Strips accents, converts leetspeak, removes separators
- **Pattern Matching**: Regex-based filtering with comprehensive word lists
- **Professional Messaging**: Clean, healthcare-appropriate error messages

### Data Storage
- **Local Storage**: All data stored in browser
- **JSON Format**: Structured data with analysis results
- **Encryption**: AES encryption for healthcare exports
- **Persistence**: Automatic saving after each entry

## 🎨 Design Features

### Color Scheme
- **Seafoam Green** (#C2DACE): Primary background
- **Tropic Blue** (#087E8B): Accent and interactive elements
- **Crane Beige** (#E5DED2): Form backgrounds
- **Obsidian** (#2C2C2C): Text and dark elements
- **Hibiscus Pink** (#E7B9B4): Warning accents

### Responsive Design
- **Mobile-First**: Optimized for phones and tablets
- **Collapsible Sections**: Space-efficient organization
- **Touch-Friendly**: Large buttons and interactive areas
- **Modern Typography**: System fonts for readability

## 🔐 Privacy & Security

- **Local-Only Storage**: No data sent to external servers
- **Encrypted Exports**: Healthcare sharing uses AES encryption
- **Content Filtering**: Professional validation prevents misuse
- **No Tracking**: No analytics or user tracking implemented

## 🌟 Advanced Features

### AI Pattern Recognition
- Identifies foods that consistently cause illness
- Recognizes safe foods eaten multiple times
- Provides personalized dietary recommendations
- Tracks correlation between activities and symptoms

### Timing Intelligence
- Enforces 3-hour separation between S and P foods
- Tracks last consumption times for each category
- Provides countdown timers for safe eating windows
- Prevents digestive conflicts through smart scheduling

### Healthcare Integration
- Professional export format for medical consultations
- Blood pressure trend analysis for cardiovascular health
- Symptom correlation tracking for diagnostic support
- Encrypted data sharing for privacy compliance

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Complete the welcome popup tutorial
3. Start logging your first meal
4. Explore the health details section
5. Check the analytics after a few entries

## 📱 Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support  
- **Edge**: Full support
- **Mobile Browsers**: Responsive design optimized

**Requirements**: Modern browser with JavaScript enabled, Local Storage support

## 🛠️ Files Structure

- `index.html`: Main application interface
- `script.js`: Core functionality and food analysis engine
- `styles.css`: Responsive design and theming
- `README.md`: This documentation

## 💡 Tips for Best Results

1. **Be Specific**: Enter detailed food descriptions for better analysis
2. **Track Consistently**: Regular logging improves AI insights
3. **Use Health Details**: Complete health tracking provides better patterns
4. **Monitor Warnings**: Pay attention to S+P combination alerts
5. **Export Regularly**: Share data with healthcare providers for professional guidance

---

**Built with ❤️ for comprehensive health tracking**  
*Combining nutritional science with modern web technology*

## Contributing
Feel free to fork this repository and submit pull requests! We welcome contributions to:
- Add new features
- Improve existing functionality
- Enhance UI/UX
- Add more data visualization options

## Acknowledgement 
Shout out to ChatGPT and Claude Sonnet 4. The best coding buddies you could ask for. ❤️

## License
BD-3 Clause License

