const socket = io();

let globalSettings = {};
let globalScoreboard = [];
let globalStyles = {};

socket.on("scoreboardChange", scoreboard => {
	updateScoreboard(scoreboard)
});

socket.on("stylesChange", styles => {
	globalStyles = styles;
	updateStyle(styles);
});

socket.on("settingsChange", settings => {
	globalSettings = settings;
})

let pictureMode = false;
let oldScoreboard = [];

function updateScoreboard(scoreboard) {
	scoreboard = sortScoreboard(scoreboard)
	globalScoreboard = scoreboard;

	const distances = scoreboard.map((score, i) => {
		const oldScoreIndex = oldScoreboard.findIndex(s => s.name === score.name);
		const movePlaces = i - oldScoreIndex;
		if (oldScoreIndex < 0) return 0;
		return movePlaces;
	})

	console.log(oldScoreboard, scoreboard);
	console.log(distances);

	const elements = document.createDocumentFragment();
	for (let i = 0; i < scoreboard.length; i++) {
		const div = document.createElement("div");
		const name = document.createElement("span");
		const score = document.createElement("span");

		div.className = "scoreItem";
		name.className = "name";
		score.className = "score";

		name.innerText = scoreboard[i].name;
		score.innerText = scoreboard[i].score;

		if (pictureMode) {
			const img = document.createElement("img");
			img.src = `profiles/${scoreboard[i].name}.png`;
			div.appendChild(img);
		}

		div.appendChild(name);
		div.appendChild(score);
		elements.appendChild(div);
	}
	document.getElementById("scoreboard").innerHTML = "";
	document.getElementById("scoreboard").appendChild(elements)

	if (globalStyles["animate"]) {
		if (globalStyles["layout-style"] == "bottom") {
			const scoresItems = document.getElementsByClassName("scoreItem");
			for (let i = 0; i < scoresItems.length; i++) {
				scoresItems[i].style.left = -1 * distances[i] * scoresItems[i].offsetWidth + "px";
			}

			// setTimeout(() => {
			// 	const scoresItems = document.getElementsByClassName("scoreItem");
			// 	for (let i = 0; i < scoresItems.length; i++) {
			// 		scoresItems[i].style.transition = "left 1s ease";
			// 		scoresItems[i].style.left = "0px";
			// 	}
			// }, 100)
		} else {
			const scoresItems = document.getElementsByClassName("scoreItem");
			for (let i = 0; i < scoresItems.length; i++) {
				scoresItems[i].style.top = -1 * distances[i] * scoresItems[i].offsetHeight + "px";
			}

			// setTimeout(() => {
			// 	const scoresItems = document.getElementsByClassName("scoreItem");
			// 	for (let i = 0; i < scoresItems.length; i++) {
			// 		scoresItems[i].style.transition = "top 1s ease";
			// 		scoresItems[i].style.top = "0px";
			// 	}
			// }, 100)
		}
	}
}

function updateStyle(styles) {
	for (const [style, value] of Object.entries(styles)) {
		if (style.endsWith("-size"))
			document.documentElement.style.setProperty('--' + style, value + "px");
		else if (style === "layout-style") {
			document.getElementById("scoreboard").className = value;
			pictureMode = value.startsWith("picture");
		}
		else
			document.documentElement.style.setProperty('--' + style, value);
	}
	updateScoreboard(globalScoreboard);
}

function sortScoreboard(scoreboard) {
	const sortBy = globalSettings["sort-by"];

	if (sortBy === "score") {
		scoreboard.sort((a, b) => b.score - a.score);
	} else if (sortBy === "name") {
		scoreboard.sort((a, b) => a.name.localeCompare(b.name));
	}
	return scoreboard
}

window.addEventListener('obsSceneChanged', function (event) {
	if (event.detail.name == "scoreboard" && globalStyles["animate"]) {
		if (globalStyles["layout-style"] == "bottom") {
			setTimeout(() => {
				const scoresItems = document.getElementsByClassName("scoreItem");
				for (let i = 0; i < scoresItems.length; i++) {
					scoresItems[i].style.transition = "left 1s ease";
					scoresItems[i].style.left = "0px";
				}
			}, 500)
		} else {
			setTimeout(() => {
				const scoresItems = document.getElementsByClassName("scoreItem");
				for (let i = 0; i < scoresItems.length; i++) {
					scoresItems[i].style.transition = "top 1s ease";
					scoresItems[i].style.top = "0px";
				}
			}, 500)
		}

		oldScoreboard = globalScoreboard.slice();
	}
})