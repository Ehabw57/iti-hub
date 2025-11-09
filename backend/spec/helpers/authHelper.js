const jwt = require("jsonwebtoken");
const User = require("../../models/User");

function mockAuth(user) {
  return (req, res, next) => {
    req.user = { id: user._id.toString(), role: user.role };
    next();
  };
}

function mockUnauthorized() {
  return (req, res, next) => {
    res.status(401).json({ message: "Unauthorized" });
  };
}

function mockMissingAuth() {
  return (req, res, next) => {
    next();
  };
}

async function createTestUser(userData = {}) {
  const defaultUserData = {
    first_name: "Test",
    last_name: "User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "user",
    ...userData,
  };

  const user = await new User(defaultUserData).save();
  
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "2h" }
  );

  return { user, token };
}

async function createMultipleTestUsers(count = 2) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const { user, token } = await createTestUser({
      email: `testuser${i + 1}@example.com`,
      first_name: `User${i + 1}`,
    });
    users.push({ user, token });
  }
  return users;
}

function makeAuthenticatedRequest(request, token) {
  return request.set('Authorization', token);
}

module.exports = {
  mockAuth,
  mockUnauthorized,
  mockMissingAuth,
  createTestUser,
  createMultipleTestUsers,
  makeAuthenticatedRequest,
};