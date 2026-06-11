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
