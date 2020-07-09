require("dotenv").config({ path: "../.env" });
const start = require("./app.js").start;
start(process.env.PORT);
