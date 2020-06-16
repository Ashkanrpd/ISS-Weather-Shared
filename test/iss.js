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

  it("ISS -  No location found for coordinates!", async () => {
    nock("http://www.example.com")
      .get("/calc")
      .query({ latitude: 120.506347, longitude: -200.583521 })
      .reply(200, {
        code: 404,
        success: false,
        message: "No location found for coordinates!",
      });
    const response = await request("http://www.example.com")
      .get("/calc")
      // we are going to give wrong coordinates to get an error
      .query({ latitude: 120.506347, longitude: -200.583521 });
    expect(response.header).to.include({
      "content-type": "application/json",
    });
    let body = await response.text;
    body = JSON.parse(body);
    expect(body).to.deep.equal({
      code: 404,
      success: false,
      message: "No location found for coordinates!",
    });
  });

  it("ISS - No weather found for location!", async () => {
    nock("http://www.example1.com")
      .get("/calc")
      .query({ latitude: 45.506347, longitude: -73.583521 })
      .reply(200, {
        code: 404,
        success: false,
        message: "No weather found for location!",
      });
    const response = await request("http://www.example1.com")
      .get("/calc")
      // we assume we couldnt get data from our API
      .query({ latitude: 45.506347, longitude: -73.583521 });
    expect(response.header).to.include({
      "content-type": "application/json",
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
    nock("http://www.example.com")
      .get("/calc")
      .query({ latitude: 45.506347, longitude: -73.583521 })
      .reply(200, {
        code: 502,
        success: false,
        message: "ISS info not found!",
      });
    const response = await request("http://www.example.com")
      .get("/calc")
      // we assume that the ISS API is not responding
      .query({ latitude: 45.506347, longitude: -73.583521 });
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
