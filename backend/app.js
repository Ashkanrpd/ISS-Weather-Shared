require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const issCollector = require("./functions/issDataCollector.js");
const distanceCalc = require("./functions/distanceCalc.js");
const weatherStack = require("./functions/weatherStack.js");
const port = process.env.PORT;

app.use("/", express.static("build")); // Needed for the HTML and JS files
app.use("/", express.static("./public")); // Needed for local assets

app.get("/calc", async (req, res) => {
  let userLatitude = req.query.latitude;
  let userLongitude = req.query.longitude;
  let issWeather;
  let userWeather;
  let issBody;
  let issLatitude;
  let issLongitude;

  if (!userLatitude || !userLongitude) {
    return res.send(
      JSON.stringify({
        code: 400,
        success: false,
        message: "Bad Request!",
      })
    );
  }
  if (
    userLatitude > 90 ||
    userLatitude < -90 ||
    userLongitude > 180 ||
    userLongitude < -180
  ) {
    return res.send(
      JSON.stringify({
        code: 404,
        success: false,
        message: "No location found for coordinates!",
      })
    );
  }

  try {
    // Finding the ISS coordinates
    issBody = await issCollector();
    if (issBody.message !== "success") {
      return res.send(
        JSON.stringify({
          code: 502,
          success: false,
          message: "ISS info not found!",
        })
      );
    }
    issLatitude = issBody.iss_position.latitude;
    issLongitude = issBody.iss_position.longitude;

    // Finding the distance between the user and nearest place to ISS on earth
    const distance = distanceCalc(
      userLatitude,
      userLongitude,
      issLatitude,
      issLongitude,
      "K"
    );

    // Finding the weather detials for the region below the ISS and user location
    let response = await weatherStack(
      userLatitude,
      userLongitude,
      issLatitude,
      issLongitude
    );
    if (
      "success" in response.wsForIssBody ||
      "success" in response.wsForUserBody ||
      isNaN(response.wsForIssBody.current.temperature) ||
      isNaN(response.wsForUserBody.current.temperature) ||
      !response.wsForIssBody.location.name ||
      !response.wsForUserBody.location.name
    ) {
      return res.send(
        JSON.stringify({
          code: 404,
          success: false,
          message: "No weather found for location!",
        })
      );
    }
    issWeather = response.wsForIssBody;
    userWeather = response.wsForUserBody;

    // Calculating the temperature difference between the international space station and user
    const tempDif =
      issWeather.current.temperature - userWeather.current.temperature;
    if (tempDif) {
      return res.send(
        JSON.stringify({
          code: 200,
          success: true,
          content: {
            distance: distance + "KM",
            tempDif: tempDif + "C",
            location: {
              observationTime: issWeather.current.observation_time,
              name: issWeather.location.name,
              country: issWeather.location.country,
              temperature: issWeather.current.temperature,
              weatherDescription: issWeather.current.weatherDescription,
              windspeed: issWeather.current.windspeed,
              humidity: issWeather.current.humidity,
              feelsLike: issWeather.current.feelsLike,
              visibility: issWeather.current.visibility,
              uvIndex: issWeather.current.uvIndex,
              icon: issWeather.current.icon,
            },
          },
        })
      );
    }
  } catch (err) {
    throw new Error(err);
  }
});

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
