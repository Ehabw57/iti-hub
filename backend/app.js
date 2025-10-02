const mongoose = require("mongoose")
const express = require("express");
const dotenv = require("dotenv");
const commentRoute = require('./routes/commentRoutes');
const messageRoute = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes')

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3030;
const DBURL = process.env.DB_URL || "mongodb://127.0.0.1:27017/iti-hub";

app.use(express.json());
app.use(commentRoute);
app.use(messageRoute);
app.use(postRoutes);

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Connected to DB");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
