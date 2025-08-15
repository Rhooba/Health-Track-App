# Food Tracker App

A comprehensive web application designed to help users track their food intake, blood pressure, and physical well-being. This app is particularly useful for individuals managing food sensitivities or tracking dietary patterns.

## Key Features

- **Food Tracking**
  - Record food items with detailed information
  - Track calories and blood pressure spikes (BPS)
  - Categorize meals by type (Breakfast, Lunch, Dinner, Snack, Dessert)
  - Mark entries as "felt sick" or "felt okay"
  - Save favorite foods that don't cause discomfort

- **Data Visualization**
  - Interactive line chart showing blood pressure trends
  - Timeline dot chart for food entries
  - Filterable food log display

- **User Experience**
  - Persistent storage of food entries using localStorage
  - Meal type filtering with dropdown menu
  - Collapsible sections for better organization
  - Modern, responsive design

## Recent Changes and Improvements

1. **Data Persistence**
   - Implemented localStorage for persistent food entry storage
   - Entries are automatically sorted by date (newest first)
   - Automatic rendering of saved entries on page load

2. **Meal Type Filtering**
   - Added comprehensive meal type dropdown (All, Breakfast, Lunch, Dinner, Snack, Dessert)
   - Real-time filtering of food entries based on selected meal type
   - Integration with chart updates for filtered data

3. **UI/UX Enhancements**
   - Added collapsible sections for better organization
   - Improved form handling with proper clearing after submission
   - Enhanced visual feedback for sick/okay status
   - Disabled favorite button for entries marked as "felt sick"

4. **Chart Integration**
   - Added blood pressure line chart for trend visualization
   - Implemented timeline dot chart for food entries
   - Charts update automatically when entries are added or filtered

## Setup
1. Clone this repository
2. Open `index.html` in your web browser
3. Start tracking your food entries and blood pressure

## Technologies Used
- HTML5
- CSS3
- JavaScript
- Chart.js (for data visualization)

## Contributing
Feel free to fork this repository and submit pull requests! We welcome contributions to:
- Add new features
- Improve existing functionality
- Enhance UI/UX
- Add more data visualization options

## License
BD-3 Clause License

