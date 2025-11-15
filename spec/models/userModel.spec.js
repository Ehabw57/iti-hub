const mongoHelper = require("../helpers/DBUtils");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

describe("User model", () => {
  const plain = "mypassword";
  const user = {
    first_name: "Ehab",
    last_name: "Hegazy",
    email: "ehab@example.com",
    password: plain,
  };
  let fresh = null;
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET;
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    fresh = new User(user);
    await fresh.save();
  });
  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it("hashes password before save", async () => {
    const fromDb = await User.findOne({ email: user.email });
    expect(fromDb).toBeDefined();
    expect(fromDb.password).not.toBe(plain);

    const match = await bcrypt.compare(plain, fromDb.password);
    expect(match).toBeTrue();
  });

  it("comparePassword returns true for correct password and false otherwise", async () => {
    const fresh = await User.findOne({ email: user.email });
    const ok = await fresh.comparePassword(plain);
    expect(ok).toBeTrue();

    const bad = await fresh.comparePassword("wrong");
    expect(bad).toBeFalse();
  });

  it("generateAuthToken returns a JWT containing id and role", async () => {
    const token = fresh.generateAuthToken();
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBeDefined();
    expect(decoded.role).toBeDefined();
  });
});
