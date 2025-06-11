const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { verifyTokenUtil } = require('../ultils/token');

const verifyAccessTokenIO = asyncHandler(async (req, res, next) => {
  if (
    req &&
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = verifyTokenUtil(token);
      console.log('HTTP: Xác thực thành công', decoded);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        mes: "Invalid access token",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      mes: "Require authorization!!!",
    });
  }
});
const verifyAccessToken = asyncHandler(async(req, res, next) => {
    if (req && req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err) return res.status(401).json({
                success: false,
                mes: "Invalid access token"
            })
            console.log(decode);
            req.user = decode
            next()
        })
    } else {
        return res.status(401).json({
            success: false,
            mes: "Require authorization!!!"
        })
    }
})
const isAdmin = asyncHandler(async(req, res, next) => {
    const { role } = req.user
    if (role !== '1')
        return res.status(401).json({
            success: false,
            mes: 'Require admin role'
        })
    next()
});

const verifySocketToken = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    console.error("❌ Token bị thiếu!");
    return next(new Error("Token không được cung cấp"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Xác thực JWT thành công:", decoded);

    if (!decoded._id) {
      console.error("🚨 JWT thiếu thông tin người dùng (_id)");
      return next(new Error("Token không hợp lệ"));
    }

    // Gán dữ liệu vào socket để sử dụng trong chatController
    socket.userId = decoded._id;
    socket.user = decoded; // Nếu cần firstname, lastname

    next();
  } catch (err) {
    console.error("🚨 Token không hợp lệ:", err.message);
    next(new Error("Token không hợp lệ"));
  }
};
module.exports = {
    verifyAccessToken,
    isAdmin,
    verifySocketToken,
    verifyAccessTokenIO,
}