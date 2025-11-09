const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const mongoHelper = require('../helpers/DBUtils')
const User = require("../../models/User");
const Connection = require("../../models/Connection");
const connectionRoute = require("../../routes/connectionRoutes");

describe("Connection routes integration", () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    await mongoHelper.connectToDB();

    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      const auth = req.header("Authorization");
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        req.user = { id: token };
      }
      next();
    });

    app.use(connectionRoute);
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it("POST /connections/request/:id - send request, then GET received/sent", async () => {
    const userA = await new User({
      first_name: "A",
      last_name: "AA",
      email: "a1@example.com",
      password: "password",
    }).save();
    const userB = await new User({
      first_name: "B",
      last_name: "BB",
      email: "b1@example.com",
      password: "password",
    }).save();

    const res = await request(app)
      .post(`/connections/request/${userB._id}`)
      .set("Authorization", `Bearer ${userA._id}`)
      .send();

    expect(res.status).toBe(201);
    expect(res.body.connection).toBeDefined();
    expect(res.body.connection.status).toBe("pending");

    const r2 = await request(app)
      .get("/connections/requests")
      .set("Authorization", `Bearer ${userB._id}`);
    expect(r2.status).toBe(200);
    expect(Array.isArray(r2.body.connections)).toBeTrue();
    expect(r2.body.connections.length).toBe(1);

    const r3 = await request(app)
      .get("/connections/requests/sent")
      .set("Authorization", `Bearer ${userA._id}`);
    expect(r3.status).toBe(200);
    expect(Array.isArray(r3.body.connections)).toBeTrue();
    expect(r3.body.connections.length).toBe(1);
  });

  it("POST /connections/request/:id - cannot send to self", async () => {
    const user = await new User({
      first_name: "S",
      last_name: "Self",
      email: "self@example.com",
      password: "password",
    }).save();
    const res = await request(app)
      .post(`/connections/request/${user._id}`)
      .set("Authorization", `Bearer ${user._id}`)
      .send();
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(
      /Cannot send connection request to yourself/i
    );
  });

  it("POST /connections/request/:id - recipient not found", async () => {
    const user = await new User({
      first_name: "X",
      last_name: "X",
      email: "x@example.com",
      password: "password",
    }).save();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/connections/request/${fakeId}`)
      .set("Authorization", `Bearer ${user._id}`)
      .send();
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Recipient not found/i);
  });

  it("POST /connections/request/:id - existing connection in same direction returns 400", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "same1@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "same2@example.com",
      password: "password",
    }).save();
    await Connection.create({
      requester_id: a._id,
      recipient_id: b._id,
      status: "pending",
    });

    const res = await request(app)
      .post(`/connections/request/${b._id}`)
      .set("Authorization", `Bearer ${a._id}`)
      .send();
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(
      /Connection request already exists|already connected/i
    );
  });

  it("POST /connections/request/:id - reversed connection auto-accepts", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "rev1@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "rev2@example.com",
      password: "password",
    }).save();
    // b had previously sent request to a
    const rev = await Connection.create({
      requester_id: b._id,
      recipient_id: a._id,
      status: "pending",
    });

    const res = await request(app)
      .post(`/connections/request/${b._id}`)
      .set("Authorization", `Bearer ${a._id}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/accepted automatically/i);

    const updated = await Connection.findById(rev._id).lean();
    expect(updated.status).toBe("accepted");
  });

  it("DELETE /connections/:id - delete accepted connection by participant", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "del1@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "del2@example.com",
      password: "password",
    }).save();
    const conn = await Connection.create({
      requester_id: a._id,
      recipient_id: b._id,
      status: "accepted",
    });

    const res = await request(app)
      .delete(`/connections/${conn._id}`)
      .set("Authorization", `Bearer ${a._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);

    const found = await Connection.findById(conn._id);
    expect(found).toBeNull();
  });

  it("DELETE /connections/:id - cannot delete non-accepted", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "na1@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "na2@example.com",
      password: "password",
    }).save();
    const conn = await Connection.create({
      requester_id: a._id,
      recipient_id: b._id,
      status: "pending",
    });

    const res = await request(app)
      .delete(`/connections/${conn._id}`)
      .set("Authorization", `Bearer ${a._id}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot delete non-accepted connection/i);
  });

  it("DELETE /connections/:id - unauthorized user cannot delete", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "u1@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "u2@example.com",
      password: "password",
    }).save();
    const c = await new User({
      first_name: "C",
      last_name: "C",
      email: "u3@example.com",
      password: "password",
    }).save();
    const conn = await Connection.create({
      requester_id: a._id,
      recipient_id: b._id,
      status: "accepted",
    });

    const res = await request(app)
      .delete(`/connections/${conn._id}`)
      .set("Authorization", `Bearer ${c._id}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Unauthorized to remove this connection/i);
  });

  it("DELETE /connections/:id - non-existent returns 404", async () => {
    const user = await new User({
      first_name: "Z",
      last_name: "Z",
      email: "z@example.com",
      password: "password",
    }).save();
    const fakeConn = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/connections/${fakeConn}`)
      .set("Authorization", `Bearer ${user._id}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Connection not found/i);
  });

  it("GET /connections - list all accepted connections", async () => {
    const a = await new User({
      first_name: "A",
      last_name: "A",
      email: "a@example.com",
      password: "password",
    }).save();
    const b = await new User({
      first_name: "B",
      last_name: "B",
      email: "b@example.com",
      password: "password",
    }).save();
    await new Connection({
      requester_id: a._id,
      recipient_id: b._id,
      status: "accepted",
    }).save();

    const res = await request(app)
      .get("/connections")
      .set("Authorization", `Bearer ${a._id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.connections)).toBeTrue();
    expect(res.body.connections.length).toBe(1);
  });

  it("PUT /connections/:id/accept - recipient can accept a pending request", async () => {
    const a = await new User({ first_name: "A", last_name: "A", email: "acc1@example.com", password: "password" }).save();
    const b = await new User({ first_name: "B", last_name: "B", email: "acc2@example.com", password: "password" }).save();
    const conn = await Connection.create({ requester_id: a._id, recipient_id: b._id, status: "pending" });

    const res = await request(app)
      .put(`/connections/${conn._id}/accept`)
      .set("Authorization", `Bearer ${b._id}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/accepted successfully|accepted automatically/i);

    const updated = await Connection.findById(conn._id).lean();
    expect(updated.status).toBe("accepted");
  });

  it("PUT /connections/:id/block - recipient can block a pending request", async () => {
    const a = await new User({ first_name: "A", last_name: "A", email: "rej1@example.com", password: "password" }).save();
    const b = await new User({ first_name: "B", last_name: "B", email: "rej2@example.com", password: "password" }).save();
    const conn = await Connection.create({ requester_id: a._id, recipient_id: b._id, status: "pending" });

    const res = await request(app)
      .put(`/connections/${conn._id}/block`)
      .set("Authorization", `Bearer ${b._id}`)
      .send();

  expect(res.status).toBe(200);
  expect(res.body.message).toMatch(/blocked successfully/i);

  const updated = await Connection.findById(conn._id).lean();
  expect(updated.status).toBe("blocked");
  });

  it("PUT /connections/:id/accept - non-recipient cannot accept", async () => {
    const a = await new User({ first_name: "A", last_name: "A", email: "uacc1@example.com", password: "password" }).save();
    const b = await new User({ first_name: "B", last_name: "B", email: "uacc2@example.com", password: "password" }).save();
    const c = await new User({ first_name: "C", last_name: "C", email: "uacc3@example.com", password: "password" }).save();
    const conn = await Connection.create({ requester_id: a._id, recipient_id: b._id, status: "pending" });

    const res = await request(app)
      .put(`/connections/${conn._id}/accept`)
      .set("Authorization", `Bearer ${c._id}`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/connection not intended for this user/i);
  });

  it("PUT /connections/:id/accept - cannot process non-pending connection", async () => {
    const a = await new User({ first_name: "A", last_name: "A", email: "np1@example.com", password: "password" }).save();
    const b = await new User({ first_name: "B", last_name: "B", email: "np2@example.com", password: "password" }).save();
    const conn = await Connection.create({ requester_id: a._id, recipient_id: b._id, status: "accepted" });

    const res = await request(app)
      .put(`/connections/${conn._id}/accept`)
      .set("Authorization", `Bearer ${b._id}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/connection already processed/i);
  });
});
