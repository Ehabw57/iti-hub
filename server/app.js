const mongoose = require("mongoose")
const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors')
const swaggerUi = require("swagger-ui-express")
const swaggerDocument = require("./docs/index")

const authRoute = require("./routes/authRoutes");
const commentRoute = require('./routes/commentRoutes');
const conversationRoute = require('./routes/conversationRoutes');
const userRouter = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const connectionRoute = require("./routes/connectionRoutes");
const feedRoutes = require("./routes/feedRoutes");
const communityRoutes = require("./routes/communityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const adminRoutes = require("./routes/adminRoutes");
const branchRoutes = require("./routes/branchRoutes");
const roundRoutes = require("./routes/roundRoutes");
const trackRoutes = require("./routes/trackRoutes");
const { multerErrorHandler } = require("./middlewares/upload");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.error('FATAL: JWT_SECRET is not set. Set JWT_SECRET in environment.');
  process.exit(1);
}
const app = express();

const PORT = process.env.PORT || 3030;
const DBURL = process.env.DB_URL || "mongodb://127.0.0.1:27017/iti-hub";

app.use(express.json());
app.use(cors())
app.use('/auth', authRoute);
app.use('/comments', commentRoute);
app.use('/conversations', conversationRoute);
app.use(userRouter);
app.use('/posts', postRoutes);
app.use(connectionRoute);
app.use('/feed', feedRoutes);
app.use('/communities', communityRoutes);
app.use('/notifications', notificationRoutes);
app.use('/search', searchRoutes);
app.use('/admin', adminRoutes);
app.use('/branches', branchRoutes);
app.use('/rounds', roundRoutes);
app.use('/tracks', trackRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/", (req, res) => {
  res.send("Hi if you are see this message!, that means that the server is running :)");
});

// Multer error handler (for file upload errors)
app.use(multerErrorHandler);

// Global error handler (MUST be last before 404)
app.use(errorHandler);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Export app for testing
module.exports = app;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(DBURL)
    .then(() => {
      console.log("Connected to DB");
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Docs at http://localhost:${PORT}/api-docs`)
      });
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
