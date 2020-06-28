require("dotenv").config();
const fetch = require("node-fetch");

const weatherStack = async function (
  userLatitude,
  userLongitude,
  issLatitude,
  issLongitude
) {
  // Finding the weather detials for the region below the ISS
  let wsForIssResponse = await fetch(
    `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${issLatitude},${issLongitude}`
  );
  let wsForIssBody = await wsForIssResponse.text();
  wsForIssBody = JSON.parse(wsForIssBody);

  // Finding the weather details for the user location
  let wsForUserResponse = await fetch(
    `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${userLatitude},${userLongitude}`
  );
  let wsForUserBody = await wsForUserResponse.text();
  wsForUserBody = JSON.parse(wsForUserBody);

  return { wsForIssBody, wsForUserBody };
};
module.exports = weatherStack;
