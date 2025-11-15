const postModel = require("../../models/Post");
const responseMock = require("../helpers/responseMock");
const { getAllPosts } = require("../../controllers/postController");
describe("Post Controller tests", () => {
  const res = responseMock();
  const req = {};
  describe("get Post by Id", () => {
    it("should rsponse with the found pohst and status 200", async () => {
      const posts = [{ title: "post1" }, { title: "post2" }];
      spyOn(postModel, "find").and.returnValue(Promise.resolve(posts));
      await getAllPosts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveSize(2)
    });

    it("should return 500 when error", async() => {
        const err = {message: "somthing bad happedn"}
      spyOn(postModel, "find").and.returnValue(Promise.reject(err));
      await getAllPosts(req, res);
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBeFalse()
      expect(res.body.message).toBe(err.message)
    })
  });
    // describe("get All Posts", () => {});
  //   describe("create Post ", () => {});
  //   describe("update Post", () => {});
  //   describe("delete Post", () => {});
  //   describe("toggle Like on Post", () => {});
  //   describe("get Post Likes", () => {});
});
