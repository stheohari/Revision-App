// --- EXAM QUIZ ENGINE ---
function updateQuestionCount() {
	count = document.getElementById("question-count-selector");

	const filterMode = document.getElementById("lecture-filter-mode")?.value || "all";
	let targetGroups = new Set();

	if (filterMode === "all") {
		// Include all groups
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
	activeQuiz = masterQuiz.filter((qz) => targetGroups.has(parseInt(qz.group)));

	// randomise order of quiz questions to prevent pattern recognition during repeated attempts and set to selected count
	activeQuiz = activeQuiz.sort(() => Math.random() - 0.5).slice(0, parseInt(count.value));
}

function updateQuestionCountSelector() {
	const selector = document.getElementById("question-count-selector");
	selector.innerHTML = "";
	const maxCount = activeQuiz.length;
	console.log(`maxCount for question count selector: ${maxCount}`);
	for (let i = 1; i <= maxCount; i++) {
		const opt = document.createElement("option");
		opt.value = i;
		opt.text = i;
		if (i === maxCount) {
			opt.selected = true;
		}
		selector.appendChild(opt);
	}
}

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
	updateQuestionCountSelector();
}
