const socket = io();

let globalSettings = {};
let globalScoreboard = [];

socket.on("scoreboardChange", scoreboard => {
	globalScoreboard = scoreboard;
	updateScoreboard(scoreboard)
});

socket.on("stylesChange", updateStyle);

socket.on("settingsChange", settings => {
	globalSettings = settings;
})

let pictureMode = false;

function updateScoreboard(scoreboard) {
	scoreboard = sortScoreboard(scoreboard)
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