const messageController = require("../../controllers/messageController");
const Message = require("../../models/Message");
const Conversation = require("../../models/Conversation");
const responseMock = require("../helpers/responseMock");

describe("Message Controller tests", () => {
  let res;

  beforeEach(() => {
    res = responseMock();
  });
  describe("getAllMessages", () => {
    it("should return all messages", async () => {
      const mockMessages = [{ content: "Hi" }, { content: "Hello" }];
      spyOn(Message, "find").and.returnValue(Promise.resolve(mockMessages));

      await messageController.getAllMessages({}, res);

      expect(Message.find).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockMessages);
    });

    it("should handle errors", async () => {
      spyOn(Message, "find").and.throwError("DB Error");

      await messageController.getAllMessages({}, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBeFalse();
    });
  });

  describe("sendMessage", () => {
    it("should send message successfully", async () => {
      const req = {
        params: { id: "507f191e810c19729de860ea" },
        body: {
          sender_id: "507f191e810c19729de860eb",
          content: "Hello",
        },
      };
      spyOn(Conversation, "findById").and.returnValue(
        Promise.resolve({
          _id: req.params.id,
          participants: [req.body.sender_id],
        })
      );

      spyOn(Message.prototype, "save").and.callFake(function () {
        return Promise.resolve(this);
      });

      spyOn(Message.prototype, "populate").and.callFake(function () {
        this.sender_id = {
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
        };
        return Promise.resolve(this);
      });

      spyOn(Conversation, "findByIdAndUpdate").and.returnValue(
        Promise.resolve()
      );

      await messageController.sendMessage(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBeTrue();
      expect(res.body.message).toBe("Message sent successfully");
    });

    it("should return 400 if sender_id is missing", async () => {
      const req = { params: { id: "123" }, body: {} };

      await messageController.sendMessage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBeFalse();
    });
  });

  describe("updateMessage", () => {
    it("should update message successfully", async () => {
      const req = {
        params: { id: "507f191e810c19729de860ec" },
        body: { sender_id: "507f191e810c19729de860ed", content: "Updated!" },
      };

      spyOn(Message, "findById").and.returnValue(
        Promise.resolve({
          _id: req.params.id,
          sender_id: req.body.sender_id,
        })
      );

      spyOn(Message, "findByIdAndUpdate").and.returnValue({
        populate: jasmine.createSpy().and.returnValue(
          Promise.resolve({
            _id: req.params.id,
            content: "Updated!",
          })
        ),
      });

      await messageController.updateMessage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Message updated successfully");
    });
  });

  describe("deleteMessage", () => {
    it("should delete message successfully", async () => {
      const req = {
        params: { id: "507f191e810c19729de860ee" },
        body: { user_id: "507f191e810c19729de860ef" },
      };

      const mockMessage = {
        _id: req.params.id,
        sender_id: req.body.user_id,
        conversation_id: "507f191e810c19729de860f0",
      };

      spyOn(Message, "findById").and.returnValue(Promise.resolve(mockMessage));
      spyOn(Message, "findByIdAndDelete").and.returnValue(Promise.resolve());

      spyOn(Message, "findOne").and.returnValue({
        sort: jasmine.createSpy().and.returnValue(Promise.resolve(null)),
      });

      spyOn(Conversation, "findById").and.returnValue(
        Promise.resolve({
          _id: mockMessage.conversation_id,
          last_message: mockMessage._id.toString(),
        })
      );

      spyOn(Conversation, "findByIdAndUpdate").and.callFake(() =>
        Promise.resolve({ acknowledged: true })
      );

      await messageController.deleteMessage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Message deleted successfully");
    });
  });
});
