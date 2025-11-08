const CommentModel = require("../../models/Comment");
const CommentLikeModel = require("../../models/CommentLike");
const PostModel = require("../../models/Post");
const responseMock = require("../helpers/responseMock");
const {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  toggleLikeComment,
  getCommentLikes,
} = require("../../controllers/commentController");

describe("Comment Controller tests", () => {
  let req, res;

  beforeEach(() => {
    res = responseMock();
    req = { params: {}, body: {}, user: {} };
  });

  const spyFind = (value) =>
    spyOn(CommentModel, "find").and.returnValue({ lean: () => value });
  const spyFindById = (value) =>
    spyOn(CommentModel, "findById").and.returnValue(value);
  const spyCreate = (value) =>
    spyOn(CommentModel, "create").and.returnValue(value);
  const spyFindOneAndUpdate = (value) =>
    spyOn(CommentModel, "findOneAndUpdate").and.returnValue(value);
  const spyDeleteMany = (value) =>
    spyOn(CommentModel, "deleteMany").and.returnValue(value);
  const spyCommentLike = (method, value) =>
    spyOn(CommentLikeModel, method).and.returnValue(value);
  const expectError = async (fn, status, msg) => {
    await fn();
    expect(res.statusCode).toBe(status);
    expect(res.body.message || res.body.error).toBe(msg);
  };

  describe("getCommentsByPost", () => {
    it("success", async () => {
      req.params.postId = "123";
      spyFind(Promise.resolve([{ content: "Hi" }]));
      await getCommentsByPost(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ content: "Hi" }]);
    });

    it("error", async () => {
      req.params.postId = "123";
      spyFind(Promise.reject({ message: "DB error" }));
      await expectError(() => getCommentsByPost(req, res), 500, "DB error");
    });
  });

  describe("createComment", () => {
    it("should create a comment and return status 201", async () => {
      req.params.postId = "p1";
      req.user.id = "u1";
      req.body.content = "Nice post";
      const post = {
        _id: "p1",
        comments_count: 0,
        save: () => Promise.resolve(),
      };
      spyOn(PostModel, "findById").and.returnValue(Promise.resolve(post));
      spyCreate(Promise.resolve({ id: "c1", content: "Nice post" }));
      await createComment(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: "c1", content: "Nice post" });
      expect(post.comments_count).toBe(1);
    });

    it("should reply to a comment and return status 201", async () => {
      req.params.postId = "p1";
      req.user.id = "u1";
      req.body = { content: "Replying", parent_comment_id: "pc1" };
      const post = {
        _id: "p1",
        comments_count: 0,
        save: () => Promise.resolve(),
      };
      spyOn(PostModel, "findById").and.returnValue(Promise.resolve(post));

      const parentComment = {
        _id: "pc1",
        post_id: "p1",
        reply_count: 0,
        save: () => Promise.resolve(),
      };
      spyFindById(Promise.resolve(parentComment));
      spyCreate(
        Promise.resolve({
          id: "c2",
          content: "Replying",
          parent_comment_id: "pc1",
        })
      );

      await createComment(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.body.parent_comment_id).toBe("pc1");
      expect(parentComment.reply_count).toBe(1);
      expect(post.comments_count).toBe(1);
    });

    it("error", async () => {
      req.params.postId = "p1";
      req.user.id = "u1";
      req.body.content = "Error";
      const post = { _id: "p1" };
      spyOn(PostModel, "findById").and.returnValue(Promise.resolve(post));
      spyCreate(Promise.reject(new Error("Save failed")));
      await expectError(() => createComment(req, res), 500, "Save failed");
    });
  });

  describe("updateComment", () => {
    it("update success", async () => {
      req.params.id = "c1";
      req.user.id = "u1";
      req.body.content = "updated";
      spyFindOneAndUpdate(Promise.resolve({ _id: "c1", content: "updated" }));

      await updateComment(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.content).toBe("updated");
    });

    it("not found", async () => {
      spyFindOneAndUpdate(Promise.resolve(null));
      await expectError(
        () => updateComment(req, res),
        404,
        "comment not found"
      );
    });

    it("error", async () => {
      spyFindOneAndUpdate(Promise.reject(new Error("DB error")));
      await expectError(() => updateComment(req, res), 500, "DB error");
    });
  });

  describe("deleteComment", () => {
    it("delete comment", async () => {
      req.params.id = "c1";
      req.user.id = "u1";
      const post = { _id: "p1", comments_count: 1, save: () => Promise.resolve() };
      spyOn(PostModel, "findById").and.returnValue(Promise.resolve(post));

      const comment = { _id: "c1", author_id: "u1" };
      spyFindById(Promise.resolve(comment));
      spyOn(CommentModel, "findByIdAndDelete").and.returnValue(
        Promise.resolve()
      );
      spyDeleteMany(Promise.resolve({ deletedCount: 2 }));
      spyCommentLike("deleteMany", Promise.resolve());

      await deleteComment(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe("c1");
      expect(post.comments_count).toBe(0);
    });

    it("decrease parent's reply_count when deleting reply", async () => {
      req.params.id = "c2";
      req.user.id = "u1";
      const post = { _id: "p1", comments_count: 1, save: () => Promise.resolve() };
      spyOn(PostModel, "findById").and.returnValue(Promise.resolve(post));

      const comment = { _id: "c2", author_id: "u1", parent_comment_id: "pc1" };
      const parentComment = {
        _id: "pc1",
        reply_count: 2,
        save: () => Promise.resolve(),
      };

      spyOn(CommentModel, "findById").and.callFake((id) => {
        if (id === "c2") return Promise.resolve(comment);
        if (id === "pc1") return Promise.resolve(parentComment);
        return Promise.resolve(null);
      });
      spyOn(CommentModel, "findByIdAndDelete").and.returnValue(
        Promise.resolve()
      );
      spyDeleteMany(Promise.resolve({ deletedCount: 0 }));
      spyCommentLike("deleteMany", Promise.resolve());

      await deleteComment(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe("c2");
      expect(parentComment.reply_count).toBe(1);
    });

    it("not found", async () => {
      spyFindById(Promise.resolve(null));
      await expectError(
        () => deleteComment(req, res),
        404,
        "comment not found"
      );
    });

    it("forbidden", async () => {
      spyFindById(Promise.resolve({ _id: "c1", author_id: "other" }));
      req.user.id = "u1";
      await expectError(() => deleteComment(req, res), 403, "forbidden");
    });

    it("error", async () => {
      spyFindById(Promise.reject(new Error("DB error")));
      await expectError(() => deleteComment(req, res), 500, "DB error");
    });
  });

  describe("toggleLikeComment", () => {
    let comment;
    beforeEach(() => {
      comment = { _id: "c1", likes_count: 0, save: () => Promise.resolve() };
      req.params.id = "c1";
      req.user.id = "u1";
    });

    it("like comment", async () => {
      spyFindById(Promise.resolve(comment));
      spyCommentLike("findOne", Promise.resolve(null));
      spyCommentLike("create", Promise.resolve());

      await toggleLikeComment(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Comment liked");
      expect(comment.likes_count).toBe(1);
    });

    it("unlike comment", async () => {
      comment.likes_count = 1;
      spyFindById(Promise.resolve(comment));
      spyCommentLike("findOne", Promise.resolve({ _id: "like1" }));
      spyCommentLike("deleteOne", Promise.resolve());

      await toggleLikeComment(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Comment unliked");
      expect(comment.likes_count).toBe(0);
    });

    it("not found", async () => {
      spyFindById(Promise.resolve(null));
      await expectError(
        () => toggleLikeComment(req, res),
        404,
        "Comment not found"
      );
    });

    it("error", async () => {
      spyFindById(Promise.reject(new Error("DB error")));
      await expectError(() => toggleLikeComment(req, res), 500, "DB error");
    });
  });

  describe("getCommentLikes", () => {
    it("success", async () => {
      req.params.id = "c1";
      const comment = { _id: "c1" };
      const likes = [{ user_id: { first_name: "John" } }];

      spyFindById(Promise.resolve(comment));
      spyOn(CommentLikeModel, "find").and.returnValue({
        populate: () => Promise.resolve(likes),
      });

      await getCommentLikes(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(likes);
    });

    it("not found", async () => {
      spyFindById(Promise.resolve(null));
      await expectError(
        () => getCommentLikes(req, res),
        404,
        "Comment not found"
      );
    });

    it("error", async () => {
      spyFindById(Promise.reject(new Error("DB error")));
      await expectError(() => getCommentLikes(req, res), 500, "DB error");
    });
  });
});
