const User = require("../../models/User");
const { register, login } = require("../../controllers/authController");
const mockResponse = require("../helpers/responseMock");

describe("Auth Controller", () => {
  let req = {};
  let res;

  beforeEach(() => {
    req.body = { email: "toti@example.com", password: "password123" };
    res = mockResponse();
  });
  describe("POST /register", () => {
    it("should return error if email already exists", async () => {
      spyOn(User, "findOne").and.returnValue(
        Promise.resolve({ email: "toti@example.com" })
      );
      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Email already in use/);
    });

    it("should reject short passwords", async () => {
      req.body.password = '123'
      spyOn(User, "findOne").and.returnValue(Promise.resolve(null));
      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        "Password must be at least 6 characters long"
      );
    });

      it('should create user successfully', async () => {
        spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
        spyOn(User.prototype, 'save').and.returnValue(Promise.resolve(true));
        spyOn(User.prototype, 'toObject').and.returnValue(req.body);

        await register(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.body.user.email).toBe(req.body.email);
      });

    describe('POST /login', () => {
      it('should return 400 if fields missing', async () => {
        await login({body:{}}, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Email and password are required');
      });

      it('should return 401 for invalid credentials', async () => {
        spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

        await login(req, res);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
        });
      });


      it('should login successfully', async () => {
        const mockUser = {
          comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(true)),
          generateAuthToken: jasmine.createSpy().and.returnValue('mockToken123')
        };

        spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

        await login(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBe('mockToken123');
      });
  });
});
