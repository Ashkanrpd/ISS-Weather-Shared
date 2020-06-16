require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT;

app.use("/", express.static("build")); // Needed for the HTML and JS files
app.use("/", express.static("./public")); // Needed for local assets

let listener;
const start = () => {
  listener = app.listen(port, "0.0.0.0", () => {
    console.log(`Server Running on port ${port}`);
  });
};
const close = () => {
  listener.close();
};

module.exports = { app, start, close };
