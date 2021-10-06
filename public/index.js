const socket = io();

let globalSettings = {};

socket.on("scoreboardChange", updateScoreboard);

socket.on("stylesChange", updateStyle);

socket.on("settingsChange", settings => {
	globalSettings = settings;
})

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

		div.appendChild(name);
		div.appendChild(score);
		elements.appendChild(div);
	}
	document.getElementById("scoreboard").innerHTML = "";
	document.getElementById("scoreboard").appendChild(elements)
}

function updateStyle(styles) {
	for (const [style, value] of Object.entries(styles)) {
		if (style.endsWith("text-size"))
			document.documentElement.style.setProperty('--' + style, value + "px");
		else if (style === "layout-style")
			document.getElementById("scoreboard").className = value;
		else
			document.documentElement.style.setProperty('--' + style, value);
	}
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