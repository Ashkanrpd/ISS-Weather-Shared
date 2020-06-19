require("dotenv").config({ path: "../.env}" });
const nock = require("nock");
const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;
const fetch = require("node-fetch");
const app = require("../app.js").app;
const start = require("../app.js").start;
const close = require("../app.js").close;

describe("ISS", () => {
  beforeEach(async () => {
    await start();
  });
  afterEach(() => close());

  it("ISS - Responded successfully", async () => {
    nock("http://api.open-notify.org")
      .get("/iss-now.json")
      .reply(200, {
        message: "success",
        timestamp: 1592504887,
        iss_position: { latitude: 7.065, longitude: -73.09 },
      });
    nock("http://api.weatherstack.com")
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=7.065,-73.09`
      )
      .reply(200, {
        request: {
          type: "City",
          query: "Floridablanca, Colombia",
          language: "en",
          unit: "m",
        },
        location: {
          name: "Floridablanca",
          country: "Colombia",
          region: "Santander",
          lat: "7.065",
          lon: "-73.090",
          timezone_id: "America/Bogota",
          localtime: "2020-06-18 15:25",
          localtime_epoch: 1592493900,
          utc_offset: "-5.0",
        },
        current: {
          observation_time: "08:25 PM",
          temperature: 25,
          weather_code: 116,
          weather_icons: [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png",
          ],
          weather_descriptions: ["Partly cloudy"],
          wind_speed: 6,
          wind_degree: 330,
          wind_dir: "NNW",
          pressure: 1014,
          precip: 1.3,
          humidity: 74,
          cloudcover: 75,
          feelslike: 27,
          uv_index: 11,
          visibility: 10,
          is_day: "yes",
        },
      });
    nock("http://api.weatherstack.com")
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=45.506347,-73.583521`
      )
      .reply(200, {
        request: {
          type: "LatLon",
          query: "Lat 45.51 and Lon -73.58",
          language: "en",
          unit: "m",
        },
        location: {
          name: "Montreal",
          country: "Canada",
          region: "Quebec",
          lat: "45.500",
          lon: "-73.583",
          timezone_id: "America/Toronto",
          localtime: "2020-06-18 16:23",
          localtime_epoch: 1592497380,
          utc_offset: "-4.0",
        },
        current: {
          observation_time: "08:23 PM",
          temperature: 33,
          weather_code: 113,
          weather_icons: [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png",
          ],
          weather_descriptions: ["Sunny"],
          wind_speed: 22,
          wind_degree: 250,
          wind_dir: "WSW",
          pressure: 1017,
          precip: 0,
          humidity: 24,
          cloudcover: 0,
          feelslike: 31,
          uv_index: 8,
          visibility: 14,
          is_day: "yes",
        },
      });
    const response = await request(app)
      .get("/calc")
      .query({ latitude: 45.506347, longitude: -73.583521 });
    expect(response.header).to.include({
      "content-type": "text/html; charset=utf-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    console.log("body", body);
    expect(body).to.include({ code: 200, success: true });
    expect(body.content).to.have.all.keys("distance", "tempDif", "location");
  });
  // ---------------------------------------------------------------------------
  it("ISS - Missing Params", async () => {
    const response = await request(app).get("/calc");
    // here we are missing params
    expect(response.header).to.include({
      "content-type": "text/html; charset=utf-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 400,
      success: false,
      message: "Bad Request!",
    });
  });
  // ---------------------------------------------------------------------------
  it("ISS -  No location found for coordinates", async () => {
    nock("http://api.weatherstack.com")
      .get("/current")
      .query({
        latitude: 8787979798799879879879879,
        longitude: 8787979798799879879879879,
      })
      .reply(404, {
        success: false,
        error: {
          code: 404,
          type: "404_not_found",
          info: "User requested a resource which does not exist.",
        },
      });
    const response = await request(app).get("/calc").query({
      latitude: 8787979798799879879879879,
      longitude: 8787979798799879879879879,
    });
    expect(response.header).to.include({
      "content-type": "text/html; charset=utf-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    console.log("body", body);
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No location found for coordinates!",
    });
  });
  // ---------------------------------------------------------------------------

  it("ISS - The API request did not return any results.!", async () => {
    nock("http://api.open-notify.org")
      .get("/iss-now.json")
      .reply(200, {
        message: "success",
        timestamp: 1592504887,
        iss_position: { latitude: 33.4605, longitude: -172.2826 },
      });
    nock("http://api.weatherstack.com")
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=33.4605,-172.2826`
      )
      .reply(404, {
        success: false,
        error: {
          code: 404,
          type: "no_results",
          info: "The API request did not return any results.",
        },
      });
    nock("http://api.weatherstack.com")
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=-52.820349,-9.206984`
      )
      .reply(404, {
        success: false,
        error: {
          code: 404,
          type: "no_results",
          info: "The API request did not return any results.",
        },
      });
    const response = await request(app).get("/calc").query({
      latitude: -52.820349,
      longitude: -9.206984,
    });
    expect(response.header).to.include({
      "content-type": "text/html; charset=utf-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No weather found for location!",
    });
  });
  // ---------------------------------------------------------------------------
  it("ISS - ISS info not found!", async () => {
    nock("http://api.open-notify.org")
      .get("/iss-now.json")
      .reply(502, { message: "fail" });

    const response = await request(app)
      .get("/calc")
      .query({ latitude: 45.506347, longitude: -73.583521 });

    expect(response.header).to.include({
      "content-type": "text/html; charset=utf-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 502,
      success: false,
      message: "ISS info not found!",
    });
  });
});
