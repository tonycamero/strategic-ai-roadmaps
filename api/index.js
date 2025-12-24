// Vercel serverless function that uses the compiled backend
const path = require('path');

// Import the compiled backend server
const app = require(path.join(__dirname, '../backend/dist/index.js')).default || require(path.join(__dirname, '../backend/dist/index.js'));

module.exports = app;
