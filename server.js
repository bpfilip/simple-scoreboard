const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require("cors")

const path = require('path');
const db = require("./db");

app.use(cors());
app.use(express.static(path.resolve(__dirname, 'public')));

const { ipcMain } = require('electron')

let window;

function setWindow(win) {
	window = win;
}

function editScore(name, value) {
	const scoreboard = db.getData("/scoreboard");
	const i = scoreboard.findIndex(score => score.name === name);
	if (i > -1) {
		scoreboard[i].score = parseInt(value);
	}
	db.push("/scoreboard", scoreboard);
	window.webContents.send("scoreboardChange", scoreboard);
	updateScoreboard();
}

io.on('connection', (socket) => {
	io.emit("stylesChange", db.getData("/styles"))
	io.emit("scoreboardChange", db.getData("/scoreboard"))

	socket.on("editScore", ({ name, value }) => {
		editScore(name, value);
	})
});

server.listen(db.getData("/settings/port") || 3000, () => {
	console.log('listening on *:' + (db.getData("/settings/port") || 3000));
});

function updateStyles() {
	io.emit("stylesChange", db.getData("/styles"))
}

function updateScoreboard() {
	io.emit("scoreboardChange", db.getData("/scoreboard"))
}

function updateSettings(settings) {
	io.emit("settingsChange", settings)
}

module.exports = { updateStyles, updateScoreboard, updateSettings, setWindow }