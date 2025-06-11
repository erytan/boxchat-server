// server/index.js
const functions = require("firebase-functions");
const express = require("express");
const app = express();

// Ví dụ: Một API đơn giản trả về "Hello from Firebase Backend!"
app.get("/api", (req, res) => {
  res.send("Hello from Firebase Backend!");
});

// Xuất app dưới dạng Firebase Function có tên "api"
exports.api = functions.https.onRequest(app);
