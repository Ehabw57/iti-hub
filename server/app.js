const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoute = require("./routes/authRoutes");
const commentRoute = require("./routes/commentRoutes");
const conversationRoute = require("./routes/conversationRoutes");
const userRouter = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const connectionRoute = require("./routes/connectionRoutes");
const feedRoutes = require("./routes/feedRoutes");
const communityRoutes = require("./routes/communityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const branchRoutes = require("./routes/branchRoutes");
const roundRoutes = require("./routes/roundRoutes");
const trackRoutes = require("./routes/trackRoutes");
const communityGroupRoutes = require("./routes/communityGroupRoutes");
const jobRoutes = require("./routes/jobRoutes");
const eventRoutes = require("./routes/eventRoutes");
const { initializeSocketServer } = require("./utils/socketServer");
const { errorHandler } = require("./middlewares/errorHandler");

dotenv.config();
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "test") {
  console.error("FATAL: JWT_SECRET is not set. Set JWT_SECRET in environment.");
  process.exit(1);
}
const app = express();
const server = http.createServer(app);
initializeSocketServer(server);
const PORT = process.env.PORT || 3030;
const DBURL = process.env.DB_URL || "mongodb://127.0.0.1:27017/iti-hub";

if (process.env.NODE_ENV === "dev") {

  const swaggerUi = require("swagger-ui-express");
  const swaggerDocument = require("./docs");

  const delayResponse = (ms) => {
    return (req, res, next) => {
      setTimeout(next, ms);
    }
  };

  app.use(delayResponse(300));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log(`Docs at http://localhost:${PORT}/api-docs`);
}

app.use(express.json());
app.use(cors());

// Locally-uploaded files (fallback storage when Cloudinary is not configured).
// .gitignore already excludes uploads/ — runtime content only, never committed.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------------------------------------------------------------
// API mounts — every router is reachable BOTH at its legacy top-level path
// (React client: /auth, /posts, /branches, ...) AND under /api/<path>
// (Angular admin dashboard production build calls /api/...).
// The admin API lives ONLY at /api/admin: the bare /admin path serves the
// admin dashboard SPA below, so there is no route clash.
// ---------------------------------------------------------------------------
const apiRouter = express.Router();
apiRouter.use("/auth", authRoute);
apiRouter.use("/comments", commentRoute);
apiRouter.use("/conversations", conversationRoute);
apiRouter.use(userRouter);
apiRouter.use("/posts", postRoutes);
apiRouter.use(connectionRoute);
apiRouter.use("/feed", feedRoutes);
apiRouter.use("/communities", communityRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/search", searchRoutes);
apiRouter.use("/admin", adminRoutes); // → /api/admin/... (bare /admin serves the dashboard SPA)
apiRouter.use("/ai", aiRoutes);
// Branches → Rounds → Tracks hierarchy + independent sections
apiRouter.use("/branches", branchRoutes);
apiRouter.use("/rounds", roundRoutes);
apiRouter.use("/tracks", trackRoutes);
apiRouter.use("/community", communityGroupRoutes);
apiRouter.use("/jobs", jobRoutes);
apiRouter.use("/events", eventRoutes);
app.use("/api", apiRouter);

// Legacy top-level mounts (React client + existing scripts) — /admin
// intentionally NOT repeated here (moved to /api/admin).
app.use("/auth", authRoute);
app.use("/comments", commentRoute);
app.use("/conversations", conversationRoute);
app.use(userRouter);
app.use("/posts", postRoutes);
app.use(connectionRoute);
app.use("/feed", feedRoutes);
app.use("/communities", communityRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);
app.use("/ai", aiRoutes);
app.use("/branches", branchRoutes);
app.use("/rounds", roundRoutes);
app.use("/tracks", trackRoutes);
app.use("/community", communityGroupRoutes);
app.use("/jobs", jobRoutes);
app.use("/events", eventRoutes);

// ---------------------------------------------------------------------------
// Admin dashboard SPA (Angular production build) served at /admin.
// Registered only when the build output exists, so dev machines without
// `ng build` are unaffected. Client-side routes (/admin/dashboard, ...) fall
// back to index.html. A method-agnostic middleware is used instead of a
// wildcard route because Express 5 changed path-to-regexp syntax.
// ---------------------------------------------------------------------------
const adminDistDir = path.resolve(__dirname, "../admin/dist/admin/browser");
if (fs.existsSync(adminDistDir)) {
  app.use("/admin", express.static(adminDistDir, { index: "index.html" }));
  app.use("/admin", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.sendFile(path.join(adminDistDir, "index.html"));
  });
  console.log("Admin dashboard served from", adminDistDir);
}
app.get("/", (req, res) => {
  res.send(
    "Hi if you are see this message!, that means that the server is running :)"
  );
});

// 404 handler - must be before error handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.url}`,
    },
  });
});

// Global error handler - must be LAST
app.use(errorHandler);

// Export app for testing
module.exports = app;

// Only start server if not in test mode
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(DBURL)
    .then(() => {
      console.log("Connected to DB", DBURL);
      server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
