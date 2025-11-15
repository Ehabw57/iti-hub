const Connection = require("../../models/Connection");
const User = require("../../models/User");
const {
  deleteConnection,
  getReceivedRequests,
  getSentRequests,
  sendConnectionRequest,
  getConnections,
  handleConnection,
} = require("../../controllers/connectionController");

const responseMock = require("../helpers/responseMock");

describe("Connection Controller Tests", () => {
  let res;
  let req;

  beforeEach(() => {
    res = responseMock();
    req = { user: { id: "user123" }, params: {}, body: {} };
  });

  describe("deleteConnection", () => {
    it("should return 404 if connection not found", async () => {
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(null));
      await deleteConnection(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Connection not found");
    });

    it("should return 403 if user not in connection", async () => {
      const conn = {
        requester_id: { equals: () => false },
        recipient_id: { equals: () => false },
        status: "accepted",
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      await deleteConnection(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe("Unauthorized to remove this connection");
    });

    it("should return 400 if connection not accepted", async () => {
      const conn = {
        requester_id: { equals: () => true },
        recipient_id: { equals: () => false },
        status: "pending",
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      await deleteConnection(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Cannot delete non-accepted connection");
    });

    it("should delete connection successfully", async () => {
      const conn = {
        requester_id: { equals: () => true },
        recipient_id: { equals: () => false },
        status: "accepted",
        deleteOne: jasmine
          .createSpy("deleteOne")
          .and.returnValue(Promise.resolve()),
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      await deleteConnection(req, res);
      expect(conn.deleteOne).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Connection deleted successfully");
    });

    it("should handle error", async () => {
      spyOn(Connection, "findById").and.returnValue(
        Promise.reject({ message: "Error" })
      );
      await deleteConnection(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Error");
    });
  });

  describe("getReceivedRequests", () => {
    it("should return list of received requests", async () => {
      const mockConnections = [{ _id: "c1" }];
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.resolve(mockConnections),
      });

      await getReceivedRequests(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.connections).toEqual(mockConnections);
    });

    it("should handle errors", async () => {
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.reject({ message: "DB error" }),
      });

      await getReceivedRequests(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("DB error");
    });
  });

  describe("getSentRequests", () => {
    it("should return sent requests", async () => {
      const mockConnections = [{ _id: "s1" }];
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.resolve(mockConnections),
      });

      await getSentRequests(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.connections).toEqual(mockConnections);
    });

    it("should handle errors", async () => {
      spyOn(Connection, "find").and.returnValue({
        populate: () => Promise.reject({ message: "Error" }),
      });

      await getSentRequests(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Error");
    });
  });

  describe("sendConnectionRequest", () => {
    it("should return 400 if recipientId missing", async () => {
      req.params = {};
      await sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Recipient ID is required");
    });

    it("should return 400 if user sends to himself", async () => {
      req.params = { id: "user123" };
      await sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Cannot send connection request to yourself");
    });

    it("should return 404 if recipient not found", async () => {
      req.params = { id: "user999" };
      spyOn(Connection, "findOne").and.returnValues(
        Promise.resolve(null),
        Promise.resolve(null)
      );
      spyOn(User, "findById").and.returnValue(Promise.resolve(null));

      await sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Recipient not found");
    });

    it("should auto-accept if reversed connection exists", async () => {
      req.params = { id: "user999" };
      const reversed = { status: "pending", save: jasmine.createSpy("save") };
      spyOn(Connection, "findOne").and.returnValues(
        Promise.resolve(null),
        Promise.resolve(reversed)
      );
      spyOn(User, "findById").and.returnValue(
        Promise.resolve({ _id: "user999" })
      );

      await sendConnectionRequest(req, res);
      expect(reversed.status).toBe("accepted");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
        "Connection request accepted automatically"
      );
    });

    it("should create a new connection if none exist", async () => {
      req.params = { id: "user999" };
      spyOn(Connection, "findOne").and.returnValues(
        Promise.resolve(null),
        Promise.resolve(null)
      );
      spyOn(User, "findById").and.returnValue(
        Promise.resolve({ _id: "user999" })
      );
      spyOn(Connection, "create").and.returnValue(
        Promise.resolve({
          requester_id: "user123",
          recipient_id: "user999",
          status: "pending",
        })
      );

      await sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Connection request sent successfully");
    });

    it("should handle errors", async () => {
      req.params = { id: "user999" };
      spyOn(Connection, "findOne").and.returnValue(
        Promise.reject({ message: "Fail" })
      );
      await sendConnectionRequest(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Fail");
    });
  });

  describe("getConnections", () => {
    it("should return filtered accepted connections", async () => {
      const mockConnections = [
        {
          requester_id: { 
            _id: { equals: (id) => id === "user123" },
            name: "User One",
            email: "user1@test.com"
          },
          recipient_id: { 
            _id: "user456",
            name: "User Two",
            email: "user2@test.com"
          },
          status: "accepted",
        },
      ];
      spyOn(Connection, "find").and.returnValue({
        populate: () => ({
          populate: () => Promise.resolve(mockConnections),
        }),
      });

      await getConnections(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.connections).toBeDefined();
      expect(res.body.connections.length).toBeGreaterThan(0);
      expect(res.body.connections[0]._id).toBe("user456");
    });

    it("should handle error", async () => {
      spyOn(Connection, "find").and.returnValue({
        populate: () => ({
          populate: () => Promise.reject({ message: "Error" }),
        }),
      });

      await getConnections(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Error");
    });
  });

  describe("handleConnection", () => {
    it("should return 404 if connection not found", async () => {
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(null));
      req.params = { id: "c1" };
      await handleConnection(req, res, "accept");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Connection not found");
    });

    it("should return 403 if connection not for this user", async () => {
      const conn = { recipient_id: { equals: () => false } };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      req.params = { id: "c1" };
      await handleConnection(req, res, "accept");
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe("connection not intended for this user");
    });

    it("should accept connection successfully", async () => {
      const conn = {
        recipient_id: { equals: () => true },
        status: "pending",
        save: jasmine.createSpy("save"),
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      req.params = { id: "c1" };
      await handleConnection(req, res, "accept");
      expect(conn.status).toBe("accepted");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Connection accepted successfully");
    });

    it("should block connection successfully", async () => {
      const conn = {
        recipient_id: { equals: () => true },
        status: "pending",
        save: jasmine.createSpy("save"),
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      req.params = { id: "c1" };
      await handleConnection(req, res, "block");
      expect(conn.status).toBe("blocked");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Connection blocked successfully");
    });

    it("should return 400 if connection already processed", async () => {
      const conn = {
        recipient_id: { equals: () => true },
        status: "accepted",
      };
      spyOn(Connection, "findById").and.returnValue(Promise.resolve(conn));
      req.params = { id: "c1" };
      await handleConnection(req, res, "accept");
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("connection already processed");
    });
  });
});
