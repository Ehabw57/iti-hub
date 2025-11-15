const userModel = require("../../models/User");
const postModel = require("../../models/Post");
const responseMock = require("../helpers/responseMock");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPosts,
} = require("../../controllers/userController");

describe("User Controller tests", () => {
  let res;
  let req;

  beforeEach(() => {
    res = responseMock();
    req = {};
  });
  describe("getAllUsers", () => {
    it("should return all users with status 200", async () => {
      const users = [{ name: "Ehab" }, { name: "Ghada" }];
      spyOn(userModel, "find").and.returnValue(Promise.resolve(users));

      await getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(users);
    });

    it("should return 500 when there is an error", async () => {
      const err = { message: "Something went wrong" };
      spyOn(userModel, "find").and.returnValue(Promise.reject(err));

      await getAllUsers(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe(err.message);
    });
  });
  describe("getUserById", () => {
    it("should return user by ID", async () => {
      req.params = { id: "123" };
      const user = { _id: "123", name: "Ehab" };
      spyOn(userModel, "findById").and.returnValue(Promise.resolve(user));

      await getUserById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(user);
    });

    it("should return 404 if user not found", async () => {
      req.params = { id: "999" };
      spyOn(userModel, "findById").and.returnValue(Promise.resolve(null));

      await getUserById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should handle server error", async () => {
      req.params = { id: "123" };
      const err = { message: "DB Error" };
      spyOn(userModel, "findById").and.returnValue(Promise.reject(err));

      await getUserById(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe(err.message);
    });
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      req.body = { name: "New User", email: "test@test.com" };
      const createdUser = { _id: "1", ...req.body };
      spyOn(userModel, "create").and.returnValue(Promise.resolve(createdUser));

      await createUser(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdUser);
    });

    it("should handle server error", async () => {
      req.body = { name: "Fail User" };
      const err = { message: "DB Error" };
      spyOn(userModel, "create").and.returnValue(Promise.reject(err));

      await createUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe(err.message);
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      req.params = { id: "123" };
      req.body = { name: "Updated Name" };
      const updatedUser = { _id: "123", name: "Updated Name" };

      spyOn(userModel, "findByIdAndUpdate").and.returnValue(
        Promise.resolve(updatedUser)
      );

      await updateUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updatedUser);
    });

    it("should return 404 if user not found", async () => {
      req.params = { id: "999" };
      req.body = { name: "Nonexistent User" };

      spyOn(userModel, "findByIdAndUpdate").and.returnValue(
        Promise.resolve(null)
      );

      await updateUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should handle server error", async () => {
      req.params = { id: "123" };
      req.body = { name: "Error User" };
      const err = { message: "Database Error" };

      spyOn(userModel, "findByIdAndUpdate").and.returnValue(
        Promise.reject(err)
      );

      await updateUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Server error");
      expect(res.body.error).toBe(err.message);
    });
  });
  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      req.params = { id: "1" };
      const deleted = { _id: "1", name: "Test" };
      spyOn(userModel, "findByIdAndDelete").and.returnValue(
        Promise.resolve(deleted)
      );

      await deleteUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("User deleted successfully");
    });

    it("should return 404 if user not found", async () => {
      req.params = { id: "999" };
      spyOn(userModel, "findByIdAndDelete").and.returnValue(
        Promise.resolve(null)
      );

      await deleteUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should handle server error", async () => {
      req.params = { id: "123" };
      const err = { message: "Database Error" };
      spyOn(userModel, "findByIdAndDelete").and.returnValue(
        Promise.reject(err)
      );

      await deleteUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Server error");
      expect(res.body.error).toBe(err.message);
    });
  });

  describe("getUserPosts", () => {
    it("should return posts of a specific user", async () => {
      req.params = { id: "123" };
      const posts = [{ title: "Post1" }, { title: "Post2" }];
      spyOn(postModel, "find").and.returnValue(Promise.resolve(posts));

      await getUserPosts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBeTrue();
      expect(res.body.data).toEqual(posts);
    });

    it("should handle errors", async () => {
      req.params = { id: "123" };
      const err = { message: "DB error" };
      spyOn(postModel, "find").and.returnValue(Promise.reject(err));

      await getUserPosts(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBeFalse();
      expect(res.body.message).toBe(err.message);
    });
  });
});
