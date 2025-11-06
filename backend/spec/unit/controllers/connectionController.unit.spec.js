const Connection = require("../../../models/Connection");
const User = require("../../../models/User");
const controller = require("../../../controllers/connectionController");
const makeRes = require("../../helpers/mockResponse");

describe("Connection controller (unit)", () => {
  afterEach(() => {
    try {
      jasmine.getEnv().allowRespy = true;
    } catch (e) {}
  });

  describe("deleteConnection", () => {
    it("returns 404 when connection not found", async () => {
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(null));
      const req = { user: { id: "u1" }, params: { id: "c1" } };
      const res = makeRes();

      await controller.deleteConnection(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/Connection not found/i);
    });

    it("returns 403 when user is not participant", async () => {
      const fakeConn = {
        requester_id: { equals: () => false },
        recipient_id: { equals: () => false },
        status: "accepted",
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(fakeConn));
      const req = { user: { id: "u1" }, params: { id: "c1" } };
      const res = makeRes();

      await controller.deleteConnection(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized to remove this connection/i);
    });

    it("returns 400 when connection is not accepted", async () => {
      const fakeConn = {
        requester_id: { equals: () => true },
        recipient_id: { equals: () => false },
        status: "pending",
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(fakeConn));
      const req = { user: { id: "u1" }, params: { id: "c1" } };
      const res = makeRes();

      await controller.deleteConnection(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Cannot delete non-accepted connection/i);
    });

    it("deletes when accepted and user is participant", async () => {
      const fakeConn = {
        requester_id: { equals: () => true },
        recipient_id: { equals: () => false },
        status: "accepted",
        deleteOne: () => Promise.resolve(),
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(fakeConn));
      const req = { user: { id: "u1" }, params: { id: "c1" } };
      const res = makeRes();

      await controller.deleteConnection(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Connection deleted successfully/i);
    });
  });

  describe("getReceivedRequests and getSentRequests", () => {
    it("getReceivedRequests returns populated connections", async () => {
      const fakeConns = [{ _id: "c1" }];
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.resolve(fakeConns),
      });
      const req = { user: { id: "u2" } };
      const res = makeRes();

      await controller.getReceivedRequests(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.connections).toBe(fakeConns);
    });

    it("getSentRequests returns populated connections", async () => {
      const fakeConns = [{ _id: "c2" }];
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.resolve(fakeConns),
      });
      const req = { user: { id: "u3" } };
      const res = makeRes();

      await controller.getSentRequests(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.connections).toBe(fakeConns);
    });
  });

  describe("sendConnectionRequest", () => {
    it("returns 400 when recipientId missing", async () => {
      const req = { user: { id: "u1" }, params: {} };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Recipient ID is required/i);
    });

    it("returns 400 when sending to self", async () => {
      const req = { user: { id: "u1" }, params: { id: "u1" } };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(
        /Cannot send connection request to yourself/i
      );
    });

    it("returns 404 when recipient not found", async () => {
      spyOn(Connection, "findOne").and.returnValue(Promise.resolve(null));
      spyOn(User, "findById").and.returnValue(Promise.resolve(null));
      const req = { user: { id: "u1" }, params: { id: "u2" } };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/Recipient not found/i);
    });

    it("returns 400 when existingConnection exists (pending)", async () => {
      const existing = { status: "pending" };
      spyOn(Connection, "findOne").and.callFake((query) => {
        // first call: existingConnection
        if (query.requester_id && query.recipient_id)
          return Promise.resolve(existing);
        return Promise.resolve(null);
      });
      spyOn(User, "findById").and.returnValue(Promise.resolve({}));
      const req = { user: { id: "u1" }, params: { id: "u2" } };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Connection request already exists/i);
    });

    it("accepts reversed connection automatically", async () => {
      const reversed = { status: "pending", save: () => Promise.resolve() };
      let call = 0;
      spyOn(Connection, "findOne").and.callFake(() => {
        call += 1;
        if (call === 1) return Promise.resolve(null); // existingConnection
        return Promise.resolve(reversed); // reversedConnection
      });
      spyOn(User, "findById").and.returnValue(Promise.resolve({}));
      const req = { user: { id: "u1" }, params: { id: "u2" } };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/accepted automatically/i);
    });

    it("creates a new pending connection when none exist", async () => {
      spyOn(Connection, "findOne").and.returnValue(Promise.resolve(null));
      spyOn(User, "findById").and.returnValue(Promise.resolve({}));
      const created = {
        _id: "newc",
        requester_id: "u1",
        recipient_id: "u2",
        status: "pending",
      };
      spyOn(Connection, "create").and.returnValue(Promise.resolve(created));

      const req = { user: { id: "u1" }, params: { id: "u2" } };
      const res = makeRes();
      await controller.sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.body.connection).toBe(created);
    });
  });
});
