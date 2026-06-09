// --- MODULE MANAGEMENT STATE ---
let loadedModules = {}; // { moduleName: { flashcards, matcher, quests, quiz } }
let currentModuleKey = null; // Currently active module identifier

const masterFlashcards = [];

const masterMatcher = [];

const masterQuests = [
	// {
	// 	id: "q-metric-tsp",
	// 	group: "7",
	// 	title: "Metric TSP 2-Approximation Algorithm Steps (Lecture 7)",
	// 	steps: [
	// 		"Compute a Minimum Spanning Tree (MST) T of the input graph instance G.",
	// 		"Duplicate every edge belonging to the MST T to produce a structural multigraph T'.",
	// 		"Find an Euler tour E traversing the multigraph T' where every vertex now has an even degree.",
	// 		"Traverse the constructed Euler tour E while applying shortcuts across previously visited nodes to assemble a clean Hamiltonian cycle H.",
	// 		"Invoke the Triangle Inequality property to assert that the shortcut cycle weight matches w(H) ≤ w(E) = 2*w(T) ≤ 2*OPT.",
	// 	],
	// 	explanation:
	// 		"This sequence forms the structural foundation of the Metric TSP 2-approximation. We leverage the fact that an MST weighs less than an optimal tour, duplicate its paths, and utilize shortcut traversals without inflating cost due to the triangle inequality.",
	// },
	// {
	// 	id: "q-freivalds-proof",
	// 	group: "8-10",
	// 	title: "Freivalds' Algorithm Failure Probability Bound Proof (Lecture 8)",
	// 	steps: [
	// 		"Assume matrix product mismatch AB ≠ C and construct the non-zero difference matrix D = AB - C.",
	// 		"Select a random vector r from {0,1}^n where every coordinate r_i is determined independently via fair coin flips.",
	// 		"Isolate a specific non-zero row vector d_i within difference matrix D containing at least one non-zero coefficient d_ik ≠ 0.",
	// 		"Expand the structural inner product requirement ∑_{j} d_ij * r_j = 0 to isolate the dependency on the target variable r_k.",
	// 		"Observe that for any fixed configuration of alternate elements, r_k can satisfy at most one specific binary value out of two options.",
	// 		"Conclude via conditional probability bounds that the absolute error check rate Pr[D * r = 0] cannot exceed 1/2.",
	// 	],
	// 	explanation:
	// 		"This proof demonstrates that a randomised binary projection vector captures structural matrix errors with a probability of at least 50% by converting matrix properties down to independent coordinate degrees of freedom.",
	// },
	// {
	// 	id: "q-3sat-reduction",
	// 	group: "4-5",
	// 	title: "3SAT to Independent Set Gadget Reduction Construction (Lecture 3/4)",
	// 	steps: [
	// 		"For each clause C_i containing 3 literals in formula ϕ, generate a triangle clause gadget containing 3 interconnected vertices.",
	// 		"Label each vertex within the triangle gadget using its corresponding literal symbol from that specific clause.",
	// 		"Introduce external consistency enforcement edges connecting every literal vertex x_j to its negated counterpart ¬x_j.",
	// 		"Set the target constraint parameter k to equal the exact total count of clauses m configured within formula ϕ.",
	// 		"Prove that ϕ is satisfiable iff the constructed graph contains an independent set of size k, capturing exactly 1 valid literal per clause.",
	// 	],
	// 	explanation:
	// 		"The reduction translates logical constraints into geometric ones: internal triangle edges force the independent set to choose at most one literal per clause, while cross-negation edges prevent assigning true states to mutually conflicting variables.",
	// },
	// {
	// 	id: "q-lp-rounding",
	// 	group: "8-10",
	// 	title: "Linear Programming Fractional Rounding Proof for Vertex Cover (Lecture 10)",
	// 	steps: [
	// 		"Formulate the discrete Minimum Vertex Cover objective function as an Integer Linear Programming system.",
	// 		"Relax the discrete criteria configuration x_v ∈ {0,1} to bounded real numbers 0 ≤ x_v ≤ 1 to establish the LP relaxation.",
	// 		"Solve the LP relaxation system in polynomial time to extract the absolute optimal fractional vector x*.",
	// 		"Construct a rounded assignment x̂ by setting x̂_v = 1 if x*_v ≥ 0.5, and setting x̂_v = 0 otherwise.",
	// 		"Verify structural edge coverage validity by showing that x*_u + x*_v ≥ 1 forces at least one endpoint to be ≥ 0.5 and thus rounded to 1.",
	// 		"Upper-bound the final cost by proving ∑ x̂_v ≤ 2 * ∑ x*_v = 2 * LP_OPT ≤ 2 * OPT.",
	// 	],
	// 	explanation:
	// 		"This sequence demonstrates how to derive a constant factor 2 approximation from fractional solutions. The relaxed LP yields a lower bound on the integer optimum, and because edges require fractional sums of at least 1, threshold rounding preserves complete structural validity.",
	// },
];

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

// --- DYNAMIC DATASET INJECTOR ENGINE ---
function handleJsonUpload(event) {
	const file = event.target.files[0];
	const statusEl = document.getElementById("import-status");
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const data = JSON.parse(e.target.result);

			// Validate required module metadata
			if (!data.moduleName) {
				throw new Error("Missing required field: 'moduleName'");
			}

			const moduleCode = data.moduleCode || "UNKNOWN";
			const moduleKey = `${moduleCode}`; // Unique key
			let counts = { flashcards: 0, proofs: 0, quiz: 0, matches: 0 };
			let invCounts = { flashcards: 0, proofs: 0, quiz: 0, matches: 0 };

			if (loadedModules[moduleKey]) {
				originalCounts = {
					flashcards: loadedModules[moduleKey].flashcards.length,
					proofs: loadedModules[moduleKey].quests.length,
					quiz: loadedModules[moduleKey].quiz.length,
					matches: loadedModules[moduleKey].matcher.length,
				};

				// Module already exists, update it
				Object.assign(loadedModules[moduleKey], {
					moduleName: data.moduleName,
					moduleCode: moduleCode,
					flashcards: [...loadedModules[moduleKey].flashcards, ...(data.flashcards || [])],
					matcher: [...loadedModules[moduleKey].matcher, ...(data.matcher || [])],
					quests: [...loadedModules[moduleKey].quests, ...(data.proofs || [])],
					quiz: [...loadedModules[moduleKey].quiz, ...(data.quiz || [])],
				});

				counts = {
					flashcards: loadedModules[moduleKey].flashcards.length - originalCounts.flashcards,
					proofs: loadedModules[moduleKey].quests.length - originalCounts.proofs,
					quiz: loadedModules[moduleKey].quiz.length - originalCounts.quiz,
					matches: loadedModules[moduleKey].matcher.length - originalCounts.matches,
				};
				console.log(
					`Updated existing module "${data.moduleName}" with new data:`,
					loadedModules[moduleKey],
				);

				// Save to localStorage for persistence
				localStorage.setItem("loadedModules", JSON.stringify(loadedModules));

				// Show completion feedback
				statusEl.className =
					"mt-2 text-center text-[11px] font-medium text-emerald-400 bg-emerald-950/20 py-1.5 px-2 rounded-lg border border-emerald-500/20";
				statusEl.innerText = `✓ Loaded module "${data.moduleName}": +${counts.flashcards} Flashcards, +${counts.proofs} Proofs, +${counts.quiz} Quiz, +${counts.matches} Matcher items.`;
				statusEl.classList.remove("hidden");

				// Update module switcher and auto-select new module
				populateModuleSwitcher();
				document.getElementById("module-switcher").value = moduleKey;
				switchModule();
			} else {
				// Create module container
				const newModule = {
					moduleName: data.moduleName,
					moduleCode: moduleCode,
					flashcards: [],
					matcher: [],
					quests: [],
					quiz: [],
				};

				// 1. Inject Flashcards
				if (data.flashcards && Array.isArray(data.flashcards)) {
					data.flashcards.forEach((fc) => {
						if (fc.group && fc.topic && fc.q && fc.a) {
							newModule.flashcards.push(fc);
							counts.flashcards++;
						} else {
							console.error("Skipped invalid flashcard element:", fc);
							invCounts.flashcards++;
						}
					});
				}

				// 2. Inject Proof Quests
				if (data.proofs && Array.isArray(data.proofs)) {
					data.proofs.forEach((pf) => {
						if (pf.id && pf.group && pf.title && pf.explanation && pf.steps) {
							newModule.quests.push(pf);
							counts.proofs++;
						} else {
							console.error("Skipped invalid proof quest element:", pf);
							invCounts.proofs++;
						}
					});
				}

				// 3. Inject Quiz Elements
				if (data.quiz && Array.isArray(data.quiz)) {
					data.quiz.forEach((qz) => {
						if (qz.group && qz.type && qz.q && qz.options && qz.correct && qz.feedback) {
							newModule.quiz.push(qz);
							counts.quiz++;
						} else {
							console.error("Skipped invalid quiz element:", qz);
							invCounts.quiz++;
						}
					});
				}

				// 4. Inject Matcher Elements
				if (data.matcher && Array.isArray(data.matcher)) {
					data.matcher.forEach((mt) => {
						if (mt.group && mt.item && mt.type && mt.desc) {
							newModule.matcher.push(mt);
							counts.matches++;
						} else {
							console.error("Skipped invalid matcher element:", mt);
							invCounts.matches++;
						}
					});
				}

				// Store module in loadedModules object
				loadedModules[moduleKey] = newModule;

				// Save to localStorage for persistence
				localStorage.setItem("loadedModules", JSON.stringify(loadedModules));

				// Show completion feedback
				statusEl.className =
					"mt-2 text-center text-[11px] font-medium text-emerald-400 bg-emerald-950/20 py-1.5 px-2 rounded-lg border border-emerald-500/20";
				statusEl.innerText = `✓ Loaded module "${data.moduleName}": +${counts.flashcards} Flashcards, +${counts.proofs} Proofs, +${counts.quiz} Quiz, +${counts.matches} Matcher items.`;
				if (invCounts.flashcards + invCounts.proofs + invCounts.quiz + invCounts.matches > 0) {
					statusEl.innerText += ` (Skipped ${invCounts.flashcards} invalid flashcards, ${invCounts.proofs} invalid proofs, ${invCounts.quiz} invalid quiz items, ${invCounts.matches} invalid matcher items)`;
				}
				statusEl.classList.remove("hidden");

				// Update module switcher and auto-select new module
				populateModuleSwitcher();
				document.getElementById("module-switcher").value = moduleKey;
				switchModule();
			}
		} catch (err) {
			console.error(err);
			statusEl.className =
				"mt-2 text-center text-[11px] font-medium text-rose-400 bg-rose-950/20 py-1.5 px-2 rounded-lg border border-rose-500/20";
			statusEl.innerText = `Error: ${err.message || "Invalid JSON structure"}`;
			statusEl.classList.remove("hidden");
		}
	};
	reader.readAsText(file);
}

// --- DYNAMIC DATASET EXPORT ENGINE ---
function downloadDataset(type) {
	if (!currentModuleKey || !loadedModules[currentModuleKey]) {
		alert("No active module selected.");
		return;
	}

	const module = loadedModules[currentModuleKey];
	let targetData;
	let filename;

	switch (type) {
		case "all":
			targetData = {
				moduleName: module.moduleName,
				moduleCode: module.moduleCode,
				flashcards: module.flashcards,
				matcher: module.matcher,
				proofs: module.quests,
				quiz: module.quiz,
			};
			filename = `${module.moduleCode}_full_export.json`;
			break;
		case "flashcards":
			targetData = {
				moduleName: module.moduleName,
				flashcards: module.flashcards,
			};
			filename = `${module.moduleCode}_flashcards_export.json`;
			break;
		case "matcher":
			targetData = {
				moduleName: module.moduleName,
				matcher: module.matcher,
			};
			filename = `${module.moduleCode}_matcher_export.json`;
			break;
		case "quest":
			targetData = {
				moduleName: module.moduleName,
				proofs: module.quests,
			};
			filename = `${module.moduleCode}_proofs_export.json`;
			break;
		case "quiz":
			targetData = {
				moduleName: module.moduleName,
				quiz: module.quiz,
			};
			filename = `${module.moduleCode}_quiz_export.json`;
			break;
		default:
			return;
	}

	const jsonString = JSON.stringify(targetData, null, 4);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function clearModule() {
	if (!currentModuleKey || !loadedModules[currentModuleKey]) {
		alert("No active module selected.");
		return;
	}

	delete loadedModules[currentModuleKey];
	localStorage.setItem("loadedModules", JSON.stringify(loadedModules));
	switchModule(); // Reset to default state

	alert("Module data cleared.");
}

function switchTab(tabId) {
	document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
	const panel = document.getElementById(`panel-${tabId}`);
	panel.classList.remove("hidden");

	document.querySelectorAll(".nav-tab").forEach((t) => {
		t.classList.remove("bg-indigo-600", "text-white");
		t.classList.add("text-slate-400");
	});
	document.getElementById(`tab-${tabId}`).classList.add("bg-indigo-600", "text-white");
	document.getElementById(`tab-${tabId}`).classList.remove("text-slate-400");

	if (tabId === "matcher") resetMatcher();
	if (tabId === "quest") setupQuestDropdown();
	if (tabId === "dataset") {
		renderDatasetViewer();
		switchDatasetTab("flashcards");
	}
}

// --- FLASHCARD ENGINE ---
function renderCard() {
	if (activeFlashcards.length === 0) {
		document.getElementById("card-topic").innerText = "Empty Bounds";
		document.getElementById("card-question").innerText =
			"No card records found matching this filter set.";
		document.getElementById("card-answer").innerText =
			"Please adjust your global lecture target configuration filter.";
		document.getElementById("card-indicator").innerText = "0 of 0";
		return;
	}
	const card = activeFlashcards[currentCardIndex];
	document.getElementById("flashcard-inner").classList.remove("flipped");
	document.getElementById("card-topic").innerText = card.topic;
	document.getElementById("card-question").innerText = card.q;
	document.getElementById("card-answer").innerText = card.a;
	document.getElementById("card-indicator").innerText =
		`Card ${currentCardIndex + 1} of ${activeFlashcards.length}`;
}
function flipCard() {
	if (activeFlashcards.length > 0)
		document.getElementById("flashcard-inner").classList.toggle("flipped");
}
function nextCard() {
	if (activeFlashcards.length > 0) {
		currentCardIndex = (currentCardIndex + 1) % activeFlashcards.length;
		renderCard();
	}
}
function prevCard() {
	if (activeFlashcards.length > 0) {
		currentCardIndex = (currentCardIndex - 1 + activeFlashcards.length) % activeFlashcards.length;
		renderCard();
	}
}

function shuffleFlashcards() {
	// Fisher-Yates shuffle algorithm
	for (let i = activeFlashcards.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[activeFlashcards[i], activeFlashcards[j]] = [activeFlashcards[j], activeFlashcards[i]];
	}

	// Reset to first card and re-render
	currentCardIndex = 0;
	renderCard();

	// Visual feedback
	showShuffleNotification();
}

function showShuffleNotification() {
	const indicator = document.getElementById("card-indicator");
	const originalText = indicator.innerText;
	indicator.innerText = "✓ Shuffled!";
	indicator.classList.add("text-emerald-400");

	setTimeout(() => {
		indicator.innerText = originalText;
		indicator.classList.remove("text-emerald-400");
	}, 1500);
}

// --- MATCHER ENGINE (UPDATED FOR MULTI-CLASS) ---
function resetMatcher() {
	matcherPool = [...activeMatcher].sort(() => Math.random() - 0.5);

	// Clear all 6 structural buckets
	document.getElementById("items-P").innerHTML = "";
	document.getElementById("items-ZPP").innerHTML = "";
	document.getElementById("items-BPP").innerHTML = "";
	document.getElementById("items-NP_CO_NP").innerHTML = "";
	document.getElementById("items-NP").innerHTML = "";
	document.getElementById("items-UNDECIDABLE").innerHTML = "";

	document.getElementById("matcher-feedback").innerText = "";
	nextMatcherItem();
}

function nextMatcherItem() {
	if (matcherPool.length === 0) {
		document.getElementById("current-matching-item").innerText =
			activeMatcher.length === 0 ? "No Active Baseline Elements" : "All Items Classified!";
		currentMatcherItem = null;
		return;
	}
	currentMatcherItem = matcherPool.pop();
	document.getElementById("current-matching-item").innerText = currentMatcherItem.item;
}

function sortItem(bucket) {
	if (!currentMatcherItem) return;
	const fb = document.getElementById("matcher-feedback");

	if (currentMatcherItem.type === bucket) {
		fb.className = "mt-4 font-semibold text-sm text-emerald-400 animate-pulse";
		fb.innerText = `Correct! ${currentMatcherItem.desc}`;

		// Safely append to the matching target container bucket
		const targetDiv = document.getElementById(`items-${bucket}`);
		if (targetDiv) {
			const itemEl = document.createElement("div");
			itemEl.className =
				"bg-slate-800 p-2 rounded-xl text-[11px] border border-slate-700 shadow-sm font-medium text-slate-200";
			itemEl.innerText = currentMatcherItem.item;
			targetDiv.appendChild(itemEl);
		}

		setTimeout(() => fb.classList.remove("animate-pulse"), 400);
		nextMatcherItem();
	} else {
		fb.className = "mt-4 font-semibold text-sm text-rose-400 animate-bounce";
		fb.innerText = `Incorrect Boundary mapping. Re-evaluate structural properties!`;
		setTimeout(() => fb.classList.remove("animate-bounce"), 500);
	}
}

// --- ALGORITHM / PROOF RECONSTRUCTION ENGINE ---
function setupQuestDropdown() {
	const selector = document.getElementById("quest-selector");
	selector.innerHTML = "";

	if (activeQuests.length === 0) {
		const opt = document.createElement("option");
		opt.text = "No quests match active filter";
		selector.add(opt);
		document.getElementById("quest-scrambled-pool").innerHTML = "";
		document.getElementById("quest-assembly-zone").innerHTML =
			'<p class="text-slate-500 text-xs italic text-center">Change target filters to unlock quests.</p>';
		return;
	}

	activeQuests.forEach((q) => {
		const opt = document.createElement("option");
		opt.value = q.id;
		opt.text = q.title;
		selector.add(opt);
	});
	loadQuest();
}

function loadQuest() {
	const id = document.getElementById("quest-selector").value;
	currentQuest = activeQuests.find((q) => q.id === id);
	if (!currentQuest) return;

	resetCurrentQuest();
}

function resetCurrentQuest() {
	userQuestSequence = [];
	document.getElementById("quest-feedback-container").classList.add("hidden");
	renderQuestAssembly();

	// Generate Scrambled Pool
	const poolContainer = document.getElementById("quest-scrambled-pool");
	poolContainer.innerHTML = "";

	// Create step pairs with structural indexing mapped to original positions
	let stepObjects = currentQuest.steps.map((text, idx) => ({ text, originalIdx: idx }));
	// Scramble order safely
	stepObjects.sort(() => Math.random() - 0.5);

	stepObjects.forEach((obj) => {
		const btn = document.createElement("button");
		btn.id = `quest-block-${obj.originalIdx}`;
		btn.className =
			"w-full text-left bg-slate-700/80 hover:bg-slate-600 border border-slate-600 p-3 rounded-xl text-xs transition duration-150 flex items-start gap-3 shadow-sm";
		btn.innerHTML = `
                    <span class="flex-shrink-0 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center font-mono text-slate-400 text-[10px]">❖</span>
                    <span class="text-slate-200 font-normal leading-relaxed">${obj.text}</span>
                `;
		btn.onclick = () => chooseQuestStep(obj.originalIdx);
		poolContainer.appendChild(btn);
	});
}

function chooseQuestStep(originalIdx) {
	if (userQuestSequence.includes(originalIdx)) return; // prevent dual inputs
	userQuestSequence.push(originalIdx);

	// Disable original pool block visually
	const block = document.getElementById(`quest-block-${originalIdx}`);
	if (block) {
		block.classList.add("opacity-30", "pointer-events-none");
	}

	renderQuestAssembly();
}

function renderQuestAssembly() {
	const zone = document.getElementById("quest-assembly-zone");
	// clear old blocks except baseline structure rules
	zone.innerHTML = "";

	if (userQuestSequence.length === 0) {
		zone.innerHTML =
			'<p id="quest-empty-tip" class="text-slate-500 text-xs italic text-center my-4">Click logical components from the pool below in step-by-step order to assemble the system...</p>';
		return;
	}

	userQuestSequence.forEach((origIdx, orderPosition) => {
		const itemDiv = document.createElement("div");
		itemDiv.className =
			"bg-indigo-950 border border-indigo-500/40 p-3 rounded-xl text-xs flex items-center justify-between shadow-md";
		itemDiv.innerHTML = `
                    <div class="flex items-start gap-3">
                        <span class="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white font-mono rounded-full flex items-center justify-center font-bold text-[10px]">${orderPosition + 1}</span>
                        <p class="text-slate-200 leading-relaxed pr-2">${currentQuest.steps[origIdx]}</p>
                    </div>
                    <button onclick="removeAssembledStep(${orderPosition}, ${origIdx})" class="text-slate-400 hover:text-rose-400 font-bold px-2 text-sm transition">✕</button>
                `;
		zone.appendChild(itemDiv);
	});
}

function removeAssembledStep(position, origIdx) {
	userQuestSequence.splice(position, 1);

	// Re-enable in the lower pool
	const block = document.getElementById(`quest-block-${origIdx}`);
	if (block) block.classList.remove("opacity-30", "pointer-events-none");

	renderQuestAssembly();
}

function verifyQuestOrder() {
	if (!currentQuest) return;
	const container = document.getElementById("quest-feedback-container");
	const title = document.getElementById("quest-feedback-title");
	const body = document.getElementById("quest-feedback-body");

	if (userQuestSequence.length < currentQuest.steps.length) {
		container.className =
			"mt-6 p-4 rounded-xl border bg-amber-950/20 border-amber-500/40 text-amber-300 block";
		title.innerText = "Incomplete Architecture Sequence";
		body.innerText =
			"Your sequence is incomplete. Please include all available steps to evaluate system correctness.";
		return;
	}

	// Check if user indices exactly equal 0, 1, 2, 3...
	let isCorrect = true;
	for (let i = 0; i < currentQuest.steps.length; i++) {
		if (userQuestSequence[i] !== i) {
			isCorrect = false;
			break;
		}
	}

	if (isCorrect) {
		container.className =
			"mt-6 p-4 rounded-xl border bg-emerald-950/20 border-emerald-500/40 text-emerald-300 block shadow-md";
		title.innerText = "Pipeline Validation Complete: 100% Correct!";
		body.innerHTML = `<strong>Theoretical Framework Breakdown:</strong><br>${currentQuest.explanation}`;
	} else {
		container.className =
			"mt-6 p-4 rounded-xl border bg-rose-950/20 border-rose-500/40 text-rose-300 block";
		title.innerText = "Verification Exception: Logic Failure Detected";
		body.innerText =
			"The operations are out of order. Review step-by-step causal dependencies (e.g., reductions must build variables before enforcing validation constraints). Clear sequence or remove steps to retry.";
	}
}

// --- EXAM QUIZ ENGINE ---
function startQuiz() {
	if (activeQuiz.length === 0) {
		return;
	}
	document.getElementById("quiz-start-screen").classList.add("hidden");
	document.getElementById("quiz-feedback-box").classList.add("hidden");
	document.getElementById("quiz-play-screen").classList.remove("hidden");
	quizIndex = 0;
	quizScore = 0;
	renderQuizQuestion();
}

function renderQuizQuestion() {
	quisanswered = false;
	document.getElementById("quiz-feedback-box").classList.add("hidden");
	document.getElementById("quiz-submit-btn").classList.add("hidden");

	const progressPercent = (quizIndex / activeQuiz.length) * 100;
	document.getElementById("quiz-progress").style.width = `${progressPercent}%`;
	document.getElementById("quiz-question-number").innerText =
		`Examination Vector ${quizIndex + 1} of ${activeQuiz.length}`;
	document.getElementById("quiz-score-tracker").innerText =
		`Score Multiplier: ${quizScore.toFixed(2)}`;

	const activeQuestion = activeQuiz[quizIndex];
	const typeBadge = document.getElementById("quiz-type-badge");

	if (activeQuestion.type === "multiple") {
		typeBadge.innerText =
			"Multiple Answer Selection Criteria (Partial Marks / Negative Penalties Active)";
		typeBadge.className =
			"px-2.5 py-1 bg-amber-950 text-amber-300 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-700";
		document.getElementById("quiz-submit-btn").classList.remove("hidden");
	} else {
		typeBadge.innerText = "Single Best Choice Strategy Configuration";
		typeBadge.className =
			"px-2.5 py-1 bg-slate-900 text-cyan-400 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-700";
	}

	document.getElementById("quiz-question-text").innerText = activeQuestion.q;

	const optionsContainer = document.getElementById("quiz-options-container");
	optionsContainer.innerHTML = "";

	activeQuestion.options.forEach((opt, idx) => {
		if (activeQuestion.type === "single") {
			const btn = document.createElement("button");
			btn.className =
				"w-full text-left bg-slate-700/70 hover:bg-slate-600 border border-slate-600 p-4 rounded-xl text-xs transition font-normal text-slate-200 leading-relaxed option-btn shadow-sm";
			btn.innerText = opt;
			btn.onclick = () => submitSingleAnswer(idx, btn);
			optionsContainer.appendChild(btn);
		} else {
			const label = document.createElement("label");
			label.className = "relative block cursor-pointer group";
			label.innerHTML = `
                        <input type="checkbox" class="peer sr-only checkbox-custom" value="${idx}">
                        <div class="w-full text-left bg-slate-700/70 group-hover:bg-slate-600 border border-slate-600 p-4 rounded-xl text-xs transition font-normal text-slate-200 leading-relaxed option-div shadow-sm">
                            ${opt}
                        </div>
                    `;
			optionsContainer.appendChild(label);
		}
	});
}

function submitSingleAnswer(chosenIdx, clickedBtn) {
	if (quisanswered) return;
	quisanswered = true;

	const activeQuestion = activeQuiz[quizIndex];
	document.querySelectorAll(".option-btn").forEach((btn) => (btn.disabled = true));

	if (chosenIdx === activeQuestion.correct[0]) {
		clickedBtn.classList.replace("bg-slate-700/70", "bg-emerald-950/60");
		clickedBtn.classList.add("border-emerald-500", "text-emerald-400", "font-bold");
		showQuizFeedback(true, activeQuestion.feedback, 1.0);
	} else {
		clickedBtn.classList.replace("bg-slate-700/70", "bg-rose-950/60");
		clickedBtn.classList.add("border-rose-500", "text-rose-400", "font-bold");
		showQuizFeedback(false, activeQuestion.feedback, 0.0);
	}
}

function submitMultipleAnswer() {
	if (quisanswered) return;
	quisanswered = true;
	document.getElementById("quiz-submit-btn").classList.add("hidden");

	const activeQuestion = activeQuiz[quizIndex];
	const checkboxes = document.querySelectorAll(".checkbox-custom");
	let selectedIndices = [];

	checkboxes.forEach((cb) => {
		cb.disabled = true;
		if (cb.checked) selectedIndices.push(parseInt(cb.value));
	});

	const correctSet = new Set(activeQuestion.correct);
	const totalCorrectAnswers = correctSet.size;

	let incrementalPoints = 0;

	// Dynamic evaluation map matching exam parameters
	checkboxes.forEach((cb, idx) => {
		const div = cb.nextElementSibling;
		if (cb.checked && correctSet.has(idx)) {
			div.classList.add(
				"border-emerald-500",
				"bg-emerald-950/60",
				"text-emerald-400",
				"font-semibold",
			);
			incrementalPoints += 1.0 / totalCorrectAnswers;
		} else if (cb.checked && !correctSet.has(idx)) {
			div.classList.add("border-rose-500", "bg-rose-950/60", "text-rose-400");
			incrementalPoints -= 1.0 / totalCorrectAnswers;
		} else if (!cb.checked && correctSet.has(idx)) {
			div.classList.add("border-amber-500/60", "bg-amber-950/20", "text-amber-300/80");
		}
	});

	// Enforce exam floor safety constraint rule per question
	incrementalPoints = Math.max(0.0, incrementalPoints);
	const isPerfect = Math.abs(incrementalPoints - 1.0) < 0.01;

	showQuizFeedback(isPerfect, activeQuestion.feedback, incrementalPoints);
}

function showQuizFeedback(isPerfect, explanation, pointsAwarded) {
	quizScore += pointsAwarded;
	document.getElementById("quiz-score-tracker").innerText =
		`Running Score: ${quizScore.toFixed(2)}`;

	const box = document.getElementById("quiz-feedback-box");
	const text = document.getElementById("quiz-feedback-text");
	const exp = document.getElementById("quiz-explanation-text");

	if (isPerfect) {
		box.className =
			"mt-6 p-4 rounded-xl border bg-emerald-950/30 border-emerald-500/40 text-emerald-400 block shadow-md";
		text.innerText = `Full Verification Credit! (+${pointsAwarded.toFixed(2)} pts)`;
	} else if (pointsAwarded > 0) {
		box.className =
			"mt-6 p-4 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-400 block";
		text.innerText = `Partial Credit Allowed. (+${pointsAwarded.toFixed(2)} pts)`;
	} else {
		box.className =
			"mt-6 p-4 rounded-xl border bg-rose-950/30 border-rose-500/40 text-rose-400 block";
		text.innerText = `Evaluation Terminated: Incorrect. (+0.00 pts)`;
	}
	exp.innerHTML = `<strong>Theoretical Explanation:</strong> ${explanation}`;
}

function advanceQuiz() {
	quizIndex++;
	if (quizIndex < activeQuiz.length) {
		renderQuizQuestion();
	} else {
		document.getElementById("quiz-play-screen").classList.add("hidden");
		document.getElementById("quiz-result-screen").classList.remove("hidden");
		document.getElementById("quiz-final-score-text").innerText =
			`Raw score safely parsed: ${quizScore.toFixed(2)} / ${activeQuiz.length}.00 total baseline parameter points.`;
	}
}

function resetQuiz() {
	document.getElementById("quiz-result-screen").classList.add("hidden");
	document.getElementById("quiz-play-screen").classList.add("hidden");
	document.getElementById("quiz-start-screen").classList.remove("hidden");
}

// function showNoModuleScreen() {
// 	document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));

// 	const mainContent = document.querySelector("main");
// 	mainContent.innerHTML = `
//         <div class="flex items-center justify-center min-h-[60vh]">
//             <div class="text-center bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl max-w-md">
//                 <div class="mb-4">
//                     <svg class="w-16 h-16 mx-auto text-slate-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
//                     </svg>
//                 </div>
//                 <h2 class="text-2xl font-bold text-slate-200 mb-2">No Modules Loaded</h2>
//                 <p class="text-slate-400 text-sm mb-6">
//                     Start by uploading a JSON file containing your revision content for a specific module.
//                 </p>
//                 <button
//                     onclick="switchTab('upload')"
//                     class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm w-full"
//                 >
//                     Go to Upload/Export
//                 </button>
//             </div>
//         </div>
//     `;
// }

function switchDatasetTab(tabName) {
	// Hide all dataset panels
	document.querySelectorAll(".dataset-content-panel").forEach((p) => p.classList.add("hidden"));
	document.getElementById(`dataset-${tabName}-panel`).classList.remove("hidden");

	// Update tab styling
	document.querySelectorAll(".dataset-nav-tab").forEach((t) => {
		t.classList.remove("bg-indigo-600", "text-white");
		t.classList.add("text-slate-400");
	});
	document.getElementById(`dataset-tab-${tabName}`).classList.add("bg-indigo-600", "text-white");
	document.getElementById(`dataset-tab-${tabName}`).classList.remove("text-slate-400");
}

function toggleDatasetCard(cardId) {
	const content = document.getElementById(`content-${cardId}`);
	const icon = document.getElementById(`icon-${cardId}`);

	if (content.classList.contains("hidden")) {
		content.classList.remove("hidden");
		icon.innerHTML = "▼";
	} else {
		content.classList.add("hidden");
		icon.innerHTML = "▶";
	}
}

function renderDatasetViewer() {
	renderFlashcardsView();
	renderMatcherView();
	renderQuestsView();
	renderQuizView();
}

function renderFlashcardsView() {
	const container = document.getElementById("dataset-flashcards");
	const badge = document.getElementById("dataset-fc-badge");
	container.innerHTML = "";

	if (activeFlashcards.length === 0) {
		container.innerHTML =
			'<p class="text-slate-500 text-xs italic text-center py-8">No flashcards loaded for this module</p>';
		badge.innerText = "(0)";
		return;
	}

	badge.innerText = `(${activeFlashcards.length})`;

	activeFlashcards.forEach((card, idx) => {
		const cardId = `fc-${idx}`;
		const cardEl = document.createElement("div");
		cardEl.className =
			"bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/50 transition my-4";
		cardEl.innerHTML = `
            <button
                onclick="toggleDatasetCard('${cardId}')"
                class="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition text-left"
            >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span id="icon-${cardId}" class="text-slate-400 flex-shrink-0">▶</span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-200 truncate">${card.topic}</p>
                        <p class="text-xs text-slate-500">Lecture ${card.group}</p>
                    </div>
                </div>
                <span class="text-xs bg-emerald-950 text-emerald-400 px-2 py-1 rounded font-medium flex-shrink-0">Q&A</span>
            </button>
            <div id="content-${cardId}" class="hidden bg-slate-950/60 border-t border-slate-700 p-3 space-y-2">
                <div>
                    <p class="text-xs font-bold text-emerald-400 mb-1">Question:</p>
                    <p class="text-sm text-slate-200">${card.q}</p>
                </div>
                <div>
                    <p class="text-xs font-bold text-cyan-400 mb-1">Answer:</p>
                    <p class="text-sm text-slate-300">${card.a}</p>
                </div>
            </div>
        `;
		container.appendChild(cardEl);
	});
}

function renderMatcherView() {
	const container = document.getElementById("dataset-matcher");
	const badge = document.getElementById("dataset-matcher-badge");
	container.innerHTML = "";

	if (activeMatcher.length === 0) {
		container.innerHTML =
			'<p class="text-slate-500 text-xs italic text-center py-8">No matcher items loaded for this module</p>';
		badge.innerText = "(0)";
		return;
	}

	badge.innerText = `(${activeMatcher.length})`;

	activeMatcher.forEach((item, idx) => {
		const cardId = `matcher-${idx}`;
		const itemEl = document.createElement("div");
		itemEl.className =
			"bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-teal-500/50 transition my-4";
		itemEl.innerHTML = `
            <button
                onclick="toggleDatasetCard('${cardId}')"
                class="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition text-left"
            >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span id="icon-${cardId}" class="text-slate-400 flex-shrink-0">▶</span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-200 truncate">${item.item}</p>
                        <p class="text-xs text-slate-500">Lecture ${item.group} • ${item.type}</p>
                    </div>
                </div>
                <span class="text-xs bg-teal-950 text-teal-400 px-2 py-1 rounded font-medium flex-shrink-0">${item.type}</span>
            </button>
            <div id="content-${cardId}" class="hidden bg-slate-950/60 border-t border-slate-700 p-3">
                <p class="text-xs font-bold text-teal-400 mb-1">Description:</p>
                <p class="text-sm text-slate-300">${item.desc}</p>
            </div>
        `;
		container.appendChild(itemEl);
	});
}

function renderQuestsView() {
	const container = document.getElementById("dataset-quests");
	const badge = document.getElementById("dataset-quest-badge");
	container.innerHTML = "";

	if (activeQuests.length === 0) {
		container.innerHTML =
			'<p class="text-slate-500 text-xs italic text-center py-8">No algorithm quests loaded for this module</p>';
		badge.innerText = "(0)";
		return;
	}

	badge.innerText = `(${activeQuests.length})`;

	activeQuests.forEach((quest, idx) => {
		const cardId = `quest-${idx}`;
		const questEl = document.createElement("div");
		questEl.className =
			"bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-amber-500/50 transition my-4";
		questEl.innerHTML = `
            <button
                onclick="toggleDatasetCard('${cardId}')"
                class="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition text-left"
            >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span id="icon-${cardId}" class="text-slate-400 flex-shrink-0">▶</span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-200 line-clamp-1">${quest.title}</p>
                        <p class="text-xs text-slate-500">Lecture ${quest.group} • ${quest.steps.length} steps</p>
                    </div>
                </div>
                <span class="text-xs bg-amber-950 text-amber-400 px-2 py-1 rounded font-medium flex-shrink-0">${quest.steps.length}S</span>
            </button>
            <div id="content-${cardId}" class="hidden bg-slate-950/60 border-t border-slate-700 p-3 space-y-3 max-h-96 overflow-y-auto">
                <div>
                    <p class="text-xs font-bold text-amber-400 mb-2">Execution Steps:</p>
                    <ol class="list-decimal space-y-1 ml-1 px-2">
                        ${quest.steps.map((s) => `<li class="text-xs text-slate-300">${s}</li><br>`).join("")}
                    </ol>
                </div>
                <div>
                    <p class="text-xs font-bold text-amber-300 mb-1">Explanation:</p>
                    <p class="text-xs text-slate-300">${quest.explanation}</p>
                </div>
            </div>
        `;
		container.appendChild(questEl);
	});
}

function renderQuizView() {
	const container = document.getElementById("dataset-quiz");
	const badge = document.getElementById("dataset-quiz-badge");
	container.innerHTML = "";

	if (activeQuiz.length === 0) {
		container.innerHTML =
			'<p class="text-slate-500 text-xs italic text-center py-8">No quiz questions loaded for this module</p>';
		badge.innerText = "(0)";
		return;
	}

	badge.innerText = `(${activeQuiz.length})`;

	activeQuiz.forEach((q, idx) => {
		const cardId = `quiz-${idx}`;
		const qEl = document.createElement("div");
		qEl.className =
			"bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition my-4";
		qEl.innerHTML = `
            <button
                onclick="toggleDatasetCard('${cardId}')"
                class="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition text-left"
            >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span id="icon-${cardId}" class="text-slate-400 flex-shrink-0">▶</span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-200 line-clamp-1">${q.q}</p>
                        <p class="text-xs text-slate-500">Lecture ${q.group} • ${q.type}</p>
                    </div>
                </div>
                <span class="text-xs bg-cyan-950 text-cyan-400 px-2 py-1 rounded font-medium flex-shrink-0">${q.options.length}A</span>
            </button>
            <div id="content-${cardId}" class="hidden bg-slate-950/60 border-t border-slate-700 p-3 space-y-3 max-h-96 overflow-y-auto">
                <div>
                    <p class="text-xs font-bold text-cyan-400 mb-2">Options:</p>
                    <ul class="space-y-1">
                        ${q.options.map((o, i) => `<li class="text-xs text-slate-300"><span class="font-semibold text-cyan-300">${String.fromCharCode(65 + i)}.</span> ${o}</li>`).join("")}
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-bold text-emerald-400 mb-1">Correct Answer(s):</p>
                    <p class="text-xs text-emerald-300 font-mono">${q.correct.map((i) => String.fromCharCode(65 + i)).join(", ")}</p>
                </div>
                <div>
                    <p class="text-xs font-bold text-slate-300 mb-1">Feedback:</p>
                    <p class="text-xs text-slate-400">${q.feedback}</p>
                </div>
            </div>
        `;
		container.appendChild(qEl);
	});
}

window.onload = function () {
	// Load modules from localStorage if available
	const saved = localStorage.getItem("loadedModules");
	if (saved) {
		try {
			loadedModules = JSON.parse(saved);
			populateModuleSwitcher();
		} catch (err) {
			alert("Failed to load saved modules. Data may be corrupted or in an invalid format. Please re-upload your modules.");
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
	}
};
