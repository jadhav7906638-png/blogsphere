const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Blog post routes
app.use("/api/posts", postRoutes);

// Comment routes
app.use("/api/comments", commentRoutes);

// MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("Mongoose connection: CONNECTED ✅");
});

mongoose.connection.on("error", (error) => {
  console.error("Mongoose connection ERROR ❌:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection: DISCONNECTED ❌");
});

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected successfully ✅");
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "BlogSphere Backend API is running 🚀",
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});