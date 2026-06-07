# Module Revision Suite

A comprehensive web-based revision platform supporting multiple modules with interactive games, quizzes, and study tools. Originally built for the COM2109 module at the University of Sheffield, now designed to support any module or course.

## Features

- **Multi-Module Support** - Upload and switch between different modules seamlessly
- **Flashcards** - Interactive flip cards with group/lecture filtering
- **Matcher** - Matching exercises for connecting related concepts
- **Proof Reconstruction** - Step-by-step algorithm and proof assembly challenges
- **Quiz Engine** - Multiple choice and multiple answer quiz questions with feedback
- **Dynamic Filtering** - Filter content by all lectures, specific lecture, or lecture range
- **Data Persistence** - Modules saved in browser localStorage (survives page refreshes)
- **Import/Export** - Upload JSON files and export individual datasets

## How to Use

### Setup

1. Download the code as a .zip or clone the repository
2. Open locally in an IDE (VS Code with Live Server extension recommended)
3. Run from `index.html`

### Getting Started

**First Time:**

1. Navigate to the **Upload/Export** tab
2. Click to upload a JSON file containing your module content
3. The module will load automatically and appear in the module selector
4. Select your module from the dropdown at the top of the page
5. Use the lecture filter to customize your study range
6. Start studying with flashcards, quizzes, or other tools!

**Subsequent Sessions:**

- Your previously uploaded modules are saved automatically
- Select from the **module dropdown** to switch between modules
- The app will remember your last active module

### Uploading New Datasets

Datasets must be in `.json` format. See `example_extension.json` for the required structure.

**JSON Format:**

```json
{
  "moduleName": "Module Name",
  "moduleCode": "MOD101",
  "flashcards": [...],
  "proofs": [...],
  "quiz": [...],
  "matcher": [...]
}
```

**Tips:**

- Required fields: `moduleName`, `moduleCode`
- Each item must have a `group` field (used for lecture filtering)
- I recommend using an AI agent to convert your content into this format
- Pass `example_extension.json` to the AI along with your content

### Features Explained

**Module Selector** - Switch between loaded modules in the header dropdown. Each module maintains its own data.

**Lecture Filtering** - Three filter modes:

- **All Lectures** - Study all content in the module
- **Specific Lecture** - Focus on a single lecture
- **Lecture Range** - Study a range (e.g., Lectures 3-7)

**Flashcards** - Flip to reveal answers. Navigate with arrow buttons.

**Matcher** - Sort items into categories based on type/description.

**Proof Reconstruction** - Arrange algorithm/proof steps in the correct order.

**Quiz** - Answer questions with instant feedback. Track your score.

**Import/Export** - Upload new modules or download your study data for backup.

## Data Storage

- **Modules are stored in browser localStorage** - They persist across page refreshes
- **No backend required** - Everything runs client-side
- **Export for backup** - Use the Export feature to save your data as JSON

To clear all data, clear your browser's localStorage for this site.

## Technical Stack

- **HTML/CSS** - Tailwind CSS for responsive styling
- **JavaScript** - Vanilla JS (no frameworks)
- **Storage** - Browser localStorage API
- **Format** - JSON for data import/export

## Future Enhancements

Potential improvements for future versions:

- Backend database for persistent cloud storage
- User accounts and progress tracking
- More question/dataset generation tools
- Mobile app optimisation
- Collaborative study groups

## AI Statement

This project uses AI tools (primarily Google Gemini and GitHub Copilot) to assist with:

- Boilerplate code generation (HTML/CSS with Tailwind)
- Generic quiz questions and flashcard content in `com2109_full.json`
- Feature implementation and refactoring

All core architecture and functionality decisions were made manually.
