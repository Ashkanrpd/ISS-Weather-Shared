require("dotenv").config();
const fetch = require("node-fetch");

const issCollector = async function () {
  let issResponse = await fetch(process.env.OPEN_NOTIFY_URL_JSON);
  let issBody = await issResponse.text();
  issBody = JSON.parse(issBody);

  return issBody;
};

module.exports = issCollector;
