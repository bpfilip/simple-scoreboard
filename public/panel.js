const socket = io();

socket.on("scoreboardChange", scores => {
	updateScoreEdit(scores);
})

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
					socket.emit('editScore', { name: score.name, value: score.score + value });
					updateScoreChangeLog({ name: score.name, change: value })
				})
				editScore.appendChild(button);
			}
			else {
				const scoreInput = document.createElement("input");
				scoreInput.value = score.score;
				scoreInput.type = "number";
				scoreInput.addEventListener("change", event => {
					socket.emit('editScore', { name: score.name, value: event.target.value });
					updateScoreChangeLog({ name: score.name, value: event.target.value })
				})
				editScore.appendChild(scoreInput);
			}
		}

		div.appendChild(name);
		div.appendChild(editScore);
		elements.appendChild(div);
	}

	document.getElementById("scores").innerHTML = ""
	document.getElementById("scores").appendChild(elements)
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