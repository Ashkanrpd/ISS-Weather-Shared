require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const port = process.env.PORT;

//This function can calculate the distance between two coordinates, i will keep it here for now
const distanceCalc = function (lat1, lon1, lat2, lon2, unit) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    let radlat1 = (Math.PI * lat1) / 180;
    let radlat2 = (Math.PI * lat2) / 180;
    let theta = lon1 - lon2;
    let radtheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
};

app.use("/", express.static("build")); // Needed for the HTML and JS files
app.use("/", express.static("./public")); // Needed for local assets

app.get("/calc", async (req, res) => {
  let userLatitude = req.query.latitude;
  let userLongitude = req.query.longitude;
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
    let issResponse = await fetch(process.env.OPEN_NOTIFY_URL_JSON);
    let issBody = await issResponse.text();
    issBody = JSON.parse(issBody);
    console.log("issBody", issBody);
    if (issBody.message !== "success") {
      return res.send(
        JSON.stringify({
          code: 502,
          success: false,
          message: "ISS info not found!",
        })
      );
    }
    // Finding the distance between the user and nearest place to ISS on earth
    const distance = distanceCalc(
      userLatitude,
      userLongitude,
      issBody.iss_position.latitude,
      issBody.iss_position.longitude,
      "K"
    );

    // Finding the weather detials for the region below the ISS
    let wsForIssResponse = await fetch(
      `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${issBody.iss_position.latitude},${issBody.iss_position.longitude}`
    );
    let wsForIssBody = await wsForIssResponse.text();
    wsForIssBody = JSON.parse(wsForIssBody);

    // Finding the weather details for the user location
    let wsForUserResponse = await fetch(
      `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${userLatitude},${userLongitude}`
    );

    let wsForUserBody = await wsForUserResponse.text();
    wsForUserBody = JSON.parse(wsForUserBody);
    console.log("wsForUserBody", wsForUserBody);
    console.log("wsForIssBody", wsForIssBody);

    if (
      "success" in wsForIssBody ||
      "success" in wsForUserBody ||
      isNaN(wsForIssBody.current.temperature) ||
      isNaN(wsForUserBody.current.temperature) ||
      !wsForIssBody.location.name ||
      !wsForUserBody.location.name
    ) {
      return res.send(
        JSON.stringify({
          code: 404,
          success: false,
          message: "No weather found for location!",
        })
      );
    }

    // Calculating the temperature difference between the international space station and user
    const tempDif =
      wsForIssBody.current.temperature - wsForUserBody.current.temperature;
    if (tempDif) {
      return res.send(
        JSON.stringify({
          code: 200,
          success: true,
          content: {
            distance: distance + "KM",
            tempDif: tempDif + "C",
            location: {
              observationTime: wsForIssBody.current.observation_time,
              name: wsForIssBody.location.name,
              country: wsForIssBody.location.country,
              temperature: wsForIssBody.current.temperature,
              weatherDescription: wsForIssBody.current.weatherDescription,
              windspeed: wsForIssBody.current.windspeed,
              humidity: wsForIssBody.current.humidity,
              feelsLike: wsForIssBody.current.feelsLike,
              visibility: wsForIssBody.current.visibility,
              uvIndex: wsForIssBody.current.uvIndex,
              icon: wsForIssBody.current.icon,
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
