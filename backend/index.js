
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ success: true, service: "money-hold-api" }));
app.use("/api/auth", authRoutes);
app.use('/api/seller', require('./routes/sellerRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
