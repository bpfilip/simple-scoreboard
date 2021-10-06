const path = require('path');

const { JsonDB } = require('node-json-db');
const db = new JsonDB(path.resolve(__dirname, 'settings.json'), true, true);

module.exports = db;