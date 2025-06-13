const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const dbconnect = require('./config/connectdb');
const initRoutes = require('./routes');
const { chatController } = require('./controllers/message');
const { verifySocketToken, verifyAccessToken, } = require('./middlewares/verifyToken');
const { verifyTokenUtil } = require('./ultils/token')

const app = express()
const server = http.createServer(app);
const port = process.env.PORT || 8000
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(cors({
//   origin: [process.env.URL_CLIENTS],
//   credentials: true

// }));
// Cho phép tất cả hoặc chỉ domain của client:
app.use(cors({ origin: process.env.URL_CLIENTS ||'https://boxchat-44824.web.app' }));
app.get('/api/some-endpoint', (req, res) => {
  res.json({ message: "Hello from Render backend" });
});
const io = new Server(server, {
  cors: {
    origin: [  process.env.URL_SERVER ||'https://boxchat-server.onrender.com'],
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.use(verifySocketToken, verifyAccessToken);
io.on("connection", (socket) => {

  socket.on("authenticate", (data, callback) => {
    const token = data.token;
    if (!token) {
      console.error("❌ Token bị thiếu!");
      return callback({ success: false, message: "Token không được cung cấp" });
    }
    try {
      const decoded = verifyTokenUtil(token)
      console.log("✅ Xác thực JWT thành công:", decoded);
      socket.user = decoded;
      callback({ success: true });
    } catch (err) {
      console.error("🚨 Token không hợp lệ:", err.message);
      callback({ success: false, message: "Token không hợp lệ" });
    }
  });

  chatController(io, socket); // Gọi chatController sau khi xác thực xong
});
dbconnect()
initRoutes(app)

server.listen(port, () => {
  console.log(`Hehehe cố gắng lên ${port}`);
})
