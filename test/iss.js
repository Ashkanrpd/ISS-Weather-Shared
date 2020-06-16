require("dotenv").config({ path: "./.env" });
const nock = require("nock");
const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;
const app = require("../app.js").app;
const start = require("../app.js").start;
const close = require("../app.js").close;

describe("ISS", () => {
  beforeEach(async () => await start());
  afterEach(() => close());

  it("ISS - Got the coords successfully", async () => {
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
    expect(body.content.location).to.have.all.keys(
      "observationTime",
      "name",
      "country",
      "temperature",
      "weatherDescription",
      "windspeed",
      "humidity",
      "feelsLike",
      "visibility",
      "uvIndex",
      "icon"
    );
  });

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

  it("ISS -  No location found for coordinates", async () => {
    nock("http://api.weatherstack.com")
      .get("/current")
      .query({
        access_key: process.env.WEATHER_STACK_ACCESS_KEY,
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
      access_key: process.env.WEATHER_STACK_ACCESS_KEY,
      latitude: 8787979798799879879879879,
      longitude: 8787979798799879879879879,
    });
    expect(response.header).to.include({
      "content-type": "application/json; Charset=UTF-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No location found for coordinates!",
    });
  });

  it("ISS - The API request did not return any results.!", async () => {
    nock("http://api.weatherstack.com")
      .get("/current")
      .query({
        access_key: process.env.WEATHER_STACK_ACCESS_KEY,
        latitude: 8787979798799879879879879,
        longitude: 8787979798799879879879879,
      })
      .reply(602, {
        success: false,
        error: {
          code: 602,
          type: "no_results",
          info: "The API request did not return any results.",
        },
      });
    const response = await request(app).get("/calc").query({
      access_key: process.env.WEATHER_STACK_ACCESS_KEY,
      latitude: 8787979798799879879879879,
      longitude: 8787979798799879879879879,
    });
    expect(response.header).to.include({
      "content-type": "application/json; Charset=UTF-8",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No weather found for location!",
    });
  });

  it("ISS - ISS info not found!", async () => {
    nock("http://api.open-notify.org")
      .get("/iss-now.json")
      .replyWithError({ code: "ETIMEDOUT" });
    const response = await request(app).get("/calc");
    expect(response.header).to.include({
      "content-type": "application/json",
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
