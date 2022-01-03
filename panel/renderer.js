const { ipcRenderer } = require('electron');

let globalSettings = {};

ipcRenderer.on("scoreboardChange", (event, args) => {
	const scoreboard = sortScoreboard(args);
	updateScoreboard(scoreboard);
	updateScoreEdit(scoreboard);
})

ipcRenderer.on("usersChange", (event, args) => {
	updateUserEdit(args);
})

ipcRenderer.on("stylesChange", (event, args) => {
	updateStyle(args);
})

ipcRenderer.on("settingsChange", (event, args) => {
	updateSettings(args);
})

ipcRenderer.on("addresses", (event, args) => {
	updatePanels(args);
})

ipcRenderer.send('requestInitialScoreboard')

function sortScoreboard(scoreboard) {
	const sortBy = globalSettings["sort-by"];

	if (sortBy === "score") {
		scoreboard.sort((a, b) => b.score - a.score)
		console.log(scoreboard);
	} else if (sortBy === "name") {
		scoreboard.sort((a, b) => a.name.localeCompare(b.name))
		console.log("name");
	}
	return scoreboard
}

navigate(localStorage.getItem("menu"));

function updateStyle(styles) {
	for (const [style, value] of Object.entries(styles)) {
		if (style.endsWith("-size"))
			document.documentElement.style.setProperty('--' + style, value + "px");
		else if (style === "layout-style")
			document.getElementById("scoreboard").className = value;
		else
			document.documentElement.style.setProperty('--' + style, value);
	}

	for (const [style, value] of Object.entries(styles)) {
		const node = document.querySelector(`#settings > div.styles > div > .input[name="${style}"]`)
		if (style.endsWith("-size") || style === "layout-style" || style == "font") {
			node.value = value;
		} else if (style === "animate") {
			if (value)
				document.getElementById("animateCheckbox").setAttribute("checked", true);
			else
				document.getElementById("animateCheckbox").removeAttribute("checked");
		}
		else {
			node.jscolor.fromString(value)
		}
	}
}

function updateSettings(settings) {
	globalSettings = settings;
	for (const [setting, value] of Object.entries(settings)) {
		const node = document.querySelector(`#settings > div.program > div > .input[name="${setting}"]`)
		node.value = value;
	}
}

function updateScoreboard(scoreboard) {
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
	document.getElementById("scoreboard").replaceChildren(elements)
	updateUserEdit(scoreboard)
}

function updateUserEdit(users) {
	const elements = document.createDocumentFragment();
	for (let i = 0; i < users.length; i++) {
		const user = users[i]
		const div = document.createElement("div");
		const name = document.createElement("input");
		const img = document.createElement("img");
		const imgInput = document.createElement("input");
		const trash = document.createElement("img");

		img.src = `../public/profiles/${user.name}.png`;
		imgInput.type = "button";
		imgInput.value = "Image";

		imgInput.onclick = () => {
			ipcRenderer.send('filePicker', user.name)
		}

		div.className = "user";
		trash.src = "img/trashcan.svg"

		name.value = user.name;
		name.addEventListener("keyup", (event) => {
			if (event.key === "Enter") {
				// Cancel the default action, if needed
				event.preventDefault();

				console.log("rename", user.name, event.target.value);
				ipcRenderer.send('renameUser', { old: user.name, new: event.target.value });
			}
		})
		trash.addEventListener("click", (event) => {
			console.log("remove", user.name);
			ipcRenderer.send('removeUser', user.name);
		})

		div.appendChild(name);
		div.appendChild(img);
		div.appendChild(imgInput);
		div.appendChild(trash);
		elements.appendChild(div);
	}

	const div = document.createElement("div");
	const name = document.createElement("input");
	name.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			// Cancel the default action, if needed
			event.preventDefault();

			console.log("new user", event.target.value);
			ipcRenderer.send('addUser', event.target.value);
		}
	})
	div.appendChild(name);
	elements.appendChild(div);

	document.getElementById("users").replaceChildren(elements)
}

function navigate(page) {
	localStorage.setItem("menu", page)
	let changed = false;
	const pages = document.getElementsByClassName("content");
	for (let i = 0; i < pages.length; i++) {
		if (i == page) {
			pages[i].classList.remove("hidden")
			changed = true;
		} else {
			pages[i].classList.add("hidden")
		}
	}
	if (!changed) {
		pages[0].classList.remove("hidden")
	}
}

function updateScoreEdit(scores) {
	const elements = document.createDocumentFragment();
	for (let i = 0; i < scores.length; i++) {
		const score = scores[i]
		const div = document.createElement("div");
		const name = document.createElement("div");
		const editScore = document.createElement("div");

		div.className = "score";
		name.className = "name";
		editScore.className = "editScore";

		name.innerText = score.name;

		for (let i = -5; i <= 5; i++) {
			if (i !== 0) {
				const button = document.createElement("button");
				button.innerText = i > 0 ? "+" + i : i;
				const value = i;
				button.addEventListener("click", event => {
					ipcRenderer.send('editScore', { name: score.name, value: score.score + value });
					updateScoreChangeLog({ name: score.name, change: value })
				})
				editScore.appendChild(button);
			}
			else {
				const scoreInput = document.createElement("input");
				scoreInput.value = score.score;
				scoreInput.type = "number";
				scoreInput.addEventListener("change", event => {
					ipcRenderer.send('editScore', { name: score.name, value: event.target.value });
					updateScoreChangeLog({ name: score.name, value: event.target.value })
				})
				editScore.appendChild(scoreInput);
			}
		}

		div.appendChild(name);
		div.appendChild(editScore);
		elements.appendChild(div);
	}

	document.getElementById("scores").replaceChildren(elements)
}

function sendStyles() {
	const styles = {};
	const nodes = document.querySelectorAll("#settings > div.styles > div > .input");
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].type === "checkbox") {
			styles[nodes[i].name] = nodes[i].checked;
		} else
			styles[nodes[i].name] = nodes[i].value;
	}

	ipcRenderer.send('updateStyles', styles);
}

function sendSettings() {
	const settings = {};
	const nodes = document.querySelectorAll("#settings > div.program > div > .input");
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].name !== "restart")
			settings[nodes[i].name] = nodes[i].value;
	}

	ipcRenderer.send('updateSettings', settings);
}

function updatePanels(addresses) {
	const panels = document.getElementById("addresses-panel");
	const scoreboards = document.getElementById("addresses-scoreboard");

	const panelsFrag = document.createDocumentFragment();
	const scoreboardsFrag = document.createDocumentFragment();

	for (let i = 0; i < addresses.length; i++) {
		const panelDiv = document.createElement("a");
		const scoreboardDiv = document.createElement("a");

		panelDiv.innerText = "http://" + addresses[i] + ":" + globalSettings.port + "/panel.html";
		panelDiv.href = "http://" + addresses[i] + ":" + globalSettings.port + "/panel.html";
		panelDiv.target = "_blank";

		scoreboardDiv.innerText = "http://" + addresses[i] + ":" + globalSettings.port;
		scoreboardDiv.href = "http://" + addresses[i] + ":" + globalSettings.port;
		scoreboardDiv.target = "_blank";

		panelsFrag.appendChild(panelDiv);
		scoreboardsFrag.appendChild(scoreboardDiv);
	}

	panels.replaceChildren(panelsFrag);
	scoreboards.replaceChildren(scoreboardsFrag);
}

function updateScoreChangeLog({ name, change, value }) {
	const div = document.createElement("div");

	const nameElm = document.createElement("div");
	const scoreElm = document.createElement("div");

	div.className = "score"
	nameElm.className = "name"
	scoreElm.className = "score"

	nameElm.innerText = name;
	if (value == undefined) {
		scoreElm.innerText = change > 0 ? "+" + change : change;
	} else {
		scoreElm.innerText = value;
		scoreElm.classList.add("value")
	}

	div.appendChild(nameElm);
	div.appendChild(scoreElm);

	document.getElementById("scoreLog").prepend(div);
}