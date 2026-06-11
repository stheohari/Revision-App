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
