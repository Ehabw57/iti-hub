const express = require("express");
const request = require("supertest");

const mongoHelper = require("../helpers/DBUtils");
const User = require("../../models/User");
const Post = require("../../models/Post");
const userRoute = require("../../routes/userRoutes");

describe("User routes integration", () => {
  let app;
  const payload = {
    first_name: "Ehab",
    last_name: "Hegazy",
    email: "ehab@example.com",
    password: "password123",
  };
  let user;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
    app = express();
    app.use(express.json());
    app.use(userRoute);
  });

  beforeEach(async () => {
    user = await new User(payload).save();
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it("POST /user - create a user", async () => {
    payload.email = "ehab2@example.com";
    const res = await request(app).post("/user").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(payload.email);
  });

  it("GET /user - returns list of users", async () => {
    const res = await request(app).get("/user");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTrue();
    expect(res.body.length).toBe(1);
  });

  it("GET /users/:id - returns a user or 404", async () => {
    const r1 = await request(app).get(`/users/${user._id}`);
    expect(r1.status).toBe(200);
    expect(r1.body.email).toBe(user.email);

    const fake = "000000000000000000000000";
    const r2 = await request(app).get(`/users/${fake}`);
    expect(r2.status).toBe(404);
  });

  it("PUT /users/:id - update and DELETE /users/:id - delete", async () => {
    const r1 = await request(app)
      .put(`/users/${user._id}`)
      .send({ first_name: "Updated" });
    expect(r1.status).toBe(200);
    expect(r1.body.first_name).toBe("Updated");

    const r2 = await request(app).delete(`/users/${user._id}`);
    expect(r2.status).toBe(200);
    expect(r2.body.message).toMatch(/deleted successfully/i);
  });

  it("GET /users/:id/posts - returns posts authored by the user", async () => {
    await Post.create({ author_id: user._id, content: "p1" });

    const res = await request(app).get(`/users/${user._id}/posts`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBeTrue();
    expect(res.body.data.length).toBe(1);
  });
});
