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
