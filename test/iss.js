require("dotenv").config({ path: "../.env}" });
const nock = require("nock");
const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;
const fetch = require("node-fetch");
const app = require("../backend/app.js").app;
const start = require("../backend/app.js").start;
const close = require("../backend/app.js").close;

describe("ISS", () => {
  beforeEach(async () => {
    await start();
  });
  afterEach(() => close());

  it("ISS - Responded successfully", async () => {
    nock(process.env.OPEN_NOTIFY_URL)
      .get("/iss-now.json")
      .reply(200, {
        message: "success",
        iss_position: { latitude: 7.065, longitude: -73.09 },
      });
    nock(process.env.WEATHER_STACK_URL)
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=7.065,-73.09`
      )
      .reply(200, {
        location: {
          name: "Floridablanca",
          country: "Colombia",
        },
        current: {
          observation_time: "08:25 PM",
          temperature: 25,
          weather_icons: [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png",
          ],
          weather_descriptions: ["Partly cloudy"],
          wind_speed: 6,
          humidity: 74,
          feelslike: 27,
          uv_index: 11,
          visibility: 10,
        },
      });
    nock(process.env.WEATHER_STACK_URL)
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=45.506347,-73.583521`
      )
      .reply(200, {
        location: {
          name: "Montreal",
          country: "Canada",
        },
        current: {
          observation_time: "08:23 PM",
          temperature: 33,
          weather_icons: [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png",
          ],
          weather_descriptions: ["Sunny"],
          wind_speed: 22,
          humidity: 24,
          feelslike: 31,
          uv_index: 8,
          visibility: 14,
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
    nock(process.env.WEATHER_STACK_URL)
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
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No location found for coordinates!",
    });
  });
  // ---------------------------------------------------------------------------

  it("ISS - The API request did not return any results.!", async () => {
    nock(process.env.OPEN_NOTIFY_URL)
      .get("/iss-now.json")
      .reply(200, {
        message: "success",
        iss_position: { latitude: 33.4605, longitude: -172.2826 },
      });
    nock(process.env.WEATHER_STACK_URL)
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=33.4605,-172.2826`
      )
      .reply(404, {
        success: false,
      });
    nock(process.env.WEATHER_STACK_URL)
      .get(
        `/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=-52.820349,-9.206984`
      )
      .reply(404, {
        success: false,
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
    nock(process.env.OPEN_NOTIFY_URL)
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
