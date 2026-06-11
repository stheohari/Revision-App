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
