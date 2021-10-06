// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const db = require("./db");
const { updateStyles, updateScoreboard, updateSettings, setWindow } = require("./server");

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false
		},
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'logo.ico')
	})

	// and load the index.html of the app.
	mainWindow.loadFile('./panel/index.html')

	setWindow(mainWindow);

	mainWindow.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	});
	// Open the DevTools.
	// mainWindow.webContents.openDevTools()
}

if (require('electron-squirrel-startup')) app.quit()
// if first time install on windows, do not run application, rather
// let squirrel installer do its work
const setupEvents = require('./installers/setup-events')
if (setupEvents.handleSquirrelEvent()) {
	process.exit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function getAddresses() {
	const { networkInterfaces } = require('os');

	const nets = networkInterfaces();
	const addresses = [];

	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
			if (net.family === 'IPv4' && !net.internal) {
				addresses.push(net.address);
			}
		}
	}
	return addresses;
}

function editScore(name, value) {
	const scoreboard = db.getData("/scoreboard");
	const i = scoreboard.findIndex(score => score.name === name);
	if (i > -1) {
		scoreboard[i].score = parseInt(value);
	}
	db.push("/scoreboard", scoreboard);
	ipcMain.emit("scoreboardChange", scoreboard);
	updateScoreboard();
}

function removeUser(name) {
	const scoreboard = db.getData("/scoreboard");
	const i = scoreboard.findIndex(score => score.name === name);
	if (i > -1) {
		scoreboard.splice(i, 1);
	}
	db.push("/scoreboard", scoreboard);
	ipcMain.emit("scoreboardChange", scoreboard);
	ipcMain.emit("usersChange", scoreboard);
	updateScoreboard();
}

function renameUser(old, newName) {
	const scoreboard = db.getData("/scoreboard");
	const i = scoreboard.findIndex(score => score.name === old);
	if (i > -1) {
		scoreboard[i].name = newName;
	}
	db.push("/scoreboard", scoreboard);
	ipcMain.emit("scoreboardChange", scoreboard);
	ipcMain.emit("usersChange", scoreboard);
	updateScoreboard();
}

function editStyles(styles) {
	db.push("/styles", styles);
	updateStyles();
}

function addUser(name) {
	const scoreboard = db.getData("/scoreboard");
	const i = scoreboard.findIndex(score => score.name === name);
	if (i == -1) {
		scoreboard.push({ name, score: 0 });
	}
	db.push("/scoreboard", scoreboard);
	ipcMain.emit("scoreboardChange", scoreboard);
	ipcMain.emit("usersChange", scoreboard);
	updateScoreboard();
}

ipcMain.on('requestInitialScoreboard', (event, arg) => {
	event.reply("settingsChange", db.getData("/settings"));
	event.reply("scoreboardChange", db.getData("/scoreboard"));
	event.reply("stylesChange", db.getData("/styles"));
	event.reply("addresses", getAddresses());
})

ipcMain.on('addUser', (event, arg) => {
	addUser(arg);
	event.reply("usersChange", db.getData("/scoreboard"));
})

ipcMain.on('removeUser', (event, arg) => {
	removeUser(arg);
	event.reply("usersChange", db.getData("/scoreboard"));
})

ipcMain.on('renameUser', (event, arg) => {
	renameUser(arg.old, arg.new);
	event.reply("usersChange", db.getData("/scoreboard"));
})

ipcMain.on('editScore', (event, arg) => {
	editScore(arg.name, arg.value);
	event.reply("scoreboardChange", db.getData("/scoreboard"));
})

ipcMain.on('updateStyles', (event, arg) => {
	editStyles(arg);
	event.reply("stylesChange", db.getData("/styles"))
})

ipcMain.on('updateSettings', (event, arg) => {
	db.push("/settings", arg);
	updateSettings(arg);
	updateStyles();
	updateScoreboard();
	event.reply("settingsChange", arg);
})