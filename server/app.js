const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/index");

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

const delayResponse = (ms) => {
  return (req, res, next) => {
    setTimeout(next, ms);
  }
};
app.use(delayResponse(300)); 

app.use(express.json());
app.use(cors());
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
app.use("/admin", adminRoutes);
app.use("/ai", aiRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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
        console.log(`Docs at http://localhost:${PORT}/api-docs`);
      });
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
