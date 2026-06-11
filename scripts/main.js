// --- MODULE MANAGEMENT STATE ---
let loadedModules = {}; // { moduleName: { flashcards, matcher, quests, quiz } }
let currentModuleKey = null; // Currently active module identifier

const masterFlashcards = [];

const masterMatcher = [];

const masterQuests = [];

const masterQuiz = [];

// --- ENGINE STATE ---
let globalFilter = "all";

let activeFlashcards = [];
let activeMatcher = [];
let activeQuests = [];
let activeQuiz = [];

let currentCardIndex = 0;
let matcherPool = [];
let currentMatcherItem = null;

let currentQuest = null;
let userQuestSequence = []; // tracks indices of chosen steps

let quizIndex = 0;
let quizScore = 0;
let quisanswered = false;

// --- MODULE SWITCHER FUNCTIONS ---
function switchModule() {
	const selector = document.getElementById("module-switcher");
	let moduleKey = selector.value;

	if (!moduleKey || !loadedModules[moduleKey]) {
		alert("Invalid module selection - reverting to default module if available.");

		if (loadedModules.firstKey) {
			moduleKey = loadedModules.firstKey();
		} else {
			// No modules loaded, reset to empty state
			currentModuleKey = null;
			masterFlashcards.length = 0;
			masterMatcher.length = 0;
			masterQuests.length = 0;
			masterQuiz.length = 0;
			updateModuleHeader("No Module Loaded", "");
			populateModuleSwitcher();
			generateLectureFilters();
			return;
		}
	}

	currentModuleKey = moduleKey;
	const module = loadedModules[moduleKey];

	// Swap active data arrays to this module's data
	masterFlashcards.length = 0;
	masterFlashcards.push(...module.flashcards);

	masterMatcher.length = 0;
	masterMatcher.push(...module.matcher);

	masterQuests.length = 0;
	masterQuests.push(...module.quests);

	masterQuiz.length = 0;
	masterQuiz.push(...module.quiz);

	// Update header to reflect active module
	updateModuleHeader(module.moduleName, module.moduleCode);

	// Save preference to localStorage
	localStorage.setItem("lastActiveModule", moduleKey);

	// Generate lecture filters based on this module's data
	generateLectureFilters();
}

function updateModuleHeader(moduleName, moduleCode) {
	document.getElementById("module-title").innerText = `${moduleCode || "Module"} - ${moduleName}`;
	document.getElementById("module-subtitle").innerText =
		`Comprehensive Study Suite • ${currentModuleKey}`;
}

function populateModuleSwitcher() {
	const selector = document.getElementById("module-switcher");
	selector.innerHTML = '<option value="">Select a module...</option>';

	Object.keys(loadedModules).forEach((key) => {
		const module = loadedModules[key];
		const opt = document.createElement("option");
		opt.value = key;
		opt.text = `${module.moduleCode} - ${module.moduleName}`;
		selector.appendChild(opt);
	});

	// Restore last active module if it exists
	const lastModule = localStorage.getItem("lastActiveModule");
	if (lastModule && loadedModules[lastModule]) {
		selector.value = lastModule;
		switchModule();
	}
}

function generateLectureFilters() {
	// Collect all unique group values from current module's data
	const groups = new Set();

	masterFlashcards.forEach((fc) => groups.add(fc.group));
	masterMatcher.forEach((mt) => groups.add(mt.group));
	masterQuests.forEach((qst) => groups.add(qst.group));
	masterQuiz.forEach((qz) => groups.add(qz.group));

	// Convert to sorted array of numbers
	const sortedGroups = Array.from(groups)
		.map((g) => parseInt(g))
		.filter((g) => !isNaN(g))
		.sort((a, b) => a - b);

	// Get the filter container and rebuild it
	const filterContainer = document.getElementById("lecture-filter-container");

	filterContainer.innerHTML = `
        <div class="flex flex-wrap gap-2 items-center">
            <label for="lecture-filter-mode" class="text-sm font-medium text-slate-300">Filter:</label>
            <select
                id="lecture-filter-mode"
                onchange="handleFilterModeChange()"
                class="bg-slate-900 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            >
                <option value="all">All Lectures</option>
                <option value="single">Specific Lecture</option>
                <option value="range">Lecture Range</option>
            </select>

            <div id="single-lecture-filter" class="hidden">
                <select
                    id="lecture-filter-single"
                    onchange="applyGlobalFilter()"
                    class="bg-slate-900 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                >
                    ${sortedGroups.map((g) => `<option value="${g}">Lecture ${g}</option>`).join("")}
                </select>
            </div>

            <div id="range-lecture-filter" class="hidden flex gap-2 items-center">
                <select
                    id="lecture-filter-start"
                    onchange="applyGlobalFilter()"
                    class="bg-slate-900 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                >
                    ${sortedGroups.map((g) => `<option value="${g}">Lecture ${g}</option>`).join("")}
                </select>
                <span class="text-slate-400">to</span>
                <select
                    id="lecture-filter-end"
                    onchange="applyGlobalFilter()"
                    class="bg-slate-900 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                >
                    ${sortedGroups.map((g) => `<option value="${g}">Lecture ${g}</option>`).join("")}
                </select>
            </div>
        </div>
    `;

	// Set the end range to the last available lecture by default
	if (sortedGroups.length > 0) {
		document.getElementById("lecture-filter-end").value = sortedGroups[sortedGroups.length - 1];
	}

	// Apply filter with updated options
	applyGlobalFilter();
}

function handleFilterModeChange() {
	const mode = document.getElementById("lecture-filter-mode").value;
	const singleFilter = document.getElementById("single-lecture-filter");
	const rangeFilter = document.getElementById("range-lecture-filter");

	// Hide all filter inputs
	singleFilter.classList.add("hidden");
	rangeFilter.classList.add("hidden");

	// Show relevant filter input
	if (mode === "single") {
		singleFilter.classList.remove("hidden");
	} else if (mode === "range") {
		rangeFilter.classList.remove("hidden");
	}

	// Apply filter
	applyGlobalFilter();
}

// --- FILTER HUB ---
function applyGlobalFilter() {
	const filterMode = document.getElementById("lecture-filter-mode")?.value || "all";
	let targetGroups = new Set();

	if (filterMode === "all") {
		// Include all groups
		masterFlashcards.forEach((fc) => targetGroups.add(parseInt(fc.group)));
		masterMatcher.forEach((mt) => targetGroups.add(parseInt(mt.group)));
		masterQuests.forEach((qst) => targetGroups.add(parseInt(qst.group)));
		masterQuiz.forEach((qz) => targetGroups.add(parseInt(qz.group)));
	} else if (filterMode === "single") {
		// Single lecture only
		const selected = parseInt(document.getElementById("lecture-filter-single")?.value || "all");
		targetGroups.add(selected);
	} else if (filterMode === "range") {
		// Range of lectures
		const start = parseInt(document.getElementById("lecture-filter-start")?.value || 1);
		const end = parseInt(document.getElementById("lecture-filter-end")?.value || 999);

		for (let i = start; i <= end; i++) {
			targetGroups.add(i);
		}
	}

	// Filter datasets based on target groups
	activeFlashcards = masterFlashcards.filter((fc) => targetGroups.has(parseInt(fc.group)));
	activeMatcher = masterMatcher.filter((mt) => targetGroups.has(parseInt(mt.group)));
	activeQuests = masterQuests.filter((qst) => targetGroups.has(parseInt(qst.group)));
	activeQuiz = masterQuiz.filter((qz) => targetGroups.has(parseInt(qz.group)));

	// randomise order of quiz questions to prevent pattern recognition during repeated attempts
	activeQuiz = activeQuiz.sort(() => Math.random() - 0.5);

	// Reset card indices and render
	currentCardIndex = 0;
	quizIndex = 0;
	renderCard();
	resetMatcher();
	setupQuestDropdown();
	renderDatasetViewer();
	resetQuiz();
}

window.onload = function () {
	// Load modules from localStorage if available
	const saved = localStorage.getItem("loadedModules");
	if (saved) {
		try {
			loadedModules = JSON.parse(saved);
			populateModuleSwitcher();
		} catch (err) {
			alert(
				"Failed to load saved modules. Data may be corrupted or in an invalid format. Please re-upload your modules.",
			);
			console.error("Failed to load saved modules:", err);
		}
	}

	// If no module is active, show the landing screen
	if (!currentModuleKey && Object.keys(loadedModules).length === 0) {
		// showNoModuleScreen();
	} else if (!currentModuleKey && Object.keys(loadedModules).length > 0) {
		// Auto-select first available module if none is active
		const firstKey = Object.keys(loadedModules)[0];
		document.getElementById("module-switcher").value = firstKey;
		switchModule();
	} else {
		generateLectureFilters();
		applyGlobalFilter();
	}
};
