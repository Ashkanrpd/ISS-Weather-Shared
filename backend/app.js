require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const issCollector = require("./functions/issDataCollector.js");
const distanceCalc = require("./functions/distanceCalc.js");
const weatherStack = require("./functions/weatherStack.js");
const customError = require("../utils/error.js");

app.use("/", express.static("build")); // Needed for the HTML and JS files
app.use("/", express.static("./public")); // Needed for local assets
app.use(cors());

function handleError(err, req, res, next) {
  if (err instanceof customError) {
    return res.status(err.code).send(JSON.stringify(err));
  }
  return res.status(500).send(JSON.stringify(err));
}

// Here we start our endpoints
app.get("/calc", async (req, res, next) => {
  try {
    let userLatitude = req.query.latitude;
    let userLongitude = req.query.longitude;
    validateParameters({ userLatitude, userLongitude });
    // Finding the ISS coordinates
    const issBody = await issCollector();
    validateIssBody({ issBody });
    const issLatitude = issBody.iss_position.latitude;
    const issLongitude = issBody.iss_position.longitude;
    // Finding the distance between the user and nearest place to ISS on earth
    const distance = await distanceCalc(
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
    validateWeatherStack({ response });
    const issWeather = response.wsForIssBody;
    const userWeather = response.wsForUserBody;
    // Calculating the temperature difference between the international space station and user
    const tempDif =
      issWeather.current.temperature - userWeather.current.temperature;
    validateTempDif({ tempDif, res, distance, issWeather });
  } catch (err) {
    next(err);
  }
});
app.use(handleError);

// Here we are done with endpoint

// We start our validators and responses
const validateParameters = (params) => {
  const { userLatitude, userLongitude } = params;
  if (!userLatitude || !userLongitude) {
    throw new customError(
      JSON.stringify({
        name: "BadRequestError",
        code: 400,
        success: false,
        msg: "Bad Request!",
      })
    );
  }
  if (
    userLatitude > 90 ||
    userLatitude < -90 ||
    userLongitude > 180 ||
    userLongitude < -180
  ) {
    throw new customError(
      JSON.stringify({
        name: "NotFoundError",
        code: 404,
        success: false,
        msg: "No location found for coordinates!",
      })
    );
  }
};

const validateIssBody = (params) => {
  const { issBody } = params;
  if (issBody.msg !== "success" && issBody.message !== "success") {
    throw new customError(
      JSON.stringify({
        name: "NotFoundError",
        code: 502,
        success: false,
        msg: "ISS info not found!",
      })
    );
  }
};

const validateWeatherStack = (params) => {
  const { response } = params;
  if (
    "success" in response.wsForIssBody ||
    "success" in response.wsForUserBody ||
    isNaN(response.wsForIssBody.current.temperature) ||
    isNaN(response.wsForUserBody.current.temperature) ||
    !response.wsForIssBody.location.name ||
    !response.wsForUserBody.location.name
  ) {
    throw new customError(
      JSON.stringify({
        name: "NotFoundError",
        code: 404,
        success: false,
        msg: "No weather found for location!",
      })
    );
  }
};

const validateTempDif = (params) => {
  const { tempDif, res, distance, issWeather } = params;
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
};

// Here we are done with our validators and responses

let listener;
const start = (port) => {
  listener = app.listen(port, "0.0.0.0", () => {
    console.log(`Server Running on port ${port}`);
  });
};
const close = () => {
  listener.close();
};

module.exports = { app, start, close };
