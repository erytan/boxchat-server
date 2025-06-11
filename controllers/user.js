const User = require("../models/user");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");
const jwt = require("jsonwebtoken");
const sendMail = require("../ultils/sendMail");

const { uploadToCloudinary } = require('../middlewares/cloudinary');

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const result = await uploadToCloudinary(req.file.path);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: result.secure_url },
      { new: true }
    ).select('-password -refreshToken');

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500);
    throw new Error('Upload failed: ' + error.message);
  }
});

const register = asyncHandler(async (req, res) => {
  const { mobile, lastname, firstname, email, password } = req.body;

  // Kiểm tra dữ liệu bắt buộc
  if (!email || !password || !mobile || !firstname || !lastname) {
    res.status(400);
    throw new Error("Vui lòng nhập đầy đủ thông tin.");
  }

  // Kiểm tra user đã tồn tại
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email đã tồn tại.");
  }

  // Lấy id_user lớn nhất hiện tại
  const lastUser = await User.findOne().sort({ id_user: -1 }).lean();
  const newId = lastUser ? String(Number(lastUser.id_user) + 1) : "1";

  // Tạo user mới
  const user = await User.create({
    id_user: newId,
    lastname,
    firstname,
    mobile,
    email,
    password,
    avatarUrl: '',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      email: user.email,
      id_user: user.id_user,
    });
  } else {
    res.status(400);
    throw new Error("Không thể tạo người dùng.");
  }
});


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      success: false,
      mess: "Missing",
    });
  const response = await User.findOne({ email });
  if (response && (await response.isCorrectPassword(password))) {
    // tách password and role ra khỏi responese
    const { password, resfreshToken, passwordResetOTP, ...userData } = response.toObject();
    userData.role = response.role;
    // tạo access token
    const accessToken = generateAccessToken(response._id, response.role, response.firstname, response.lastname);
    // tạo refresh token
    const newRefreshToken = generateRefreshToken(response._id);
    // lưu refreshToken vào database
    await User.findByIdAndUpdate(
      response._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    // lưu refreshToken vào cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Invalid password");
  }
});
const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select("-refreshToken -password -passwordResetOTP ");
  return res.status(200).json({
    success: user ? true : false,
    rs: user ? user : "User not found",
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Lấy token từ cookie
    const cookies = req.cookies;

    // Kiểm tra xem refreshToken có tồn tại không
    if (!cookies || !cookies.refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token found in cookies',
      });
    }

    // Xác thực refreshToken
    const rs = await jwt.verify(cookies.refreshToken, process.env.JWT_SECRET);

    // Tìm người dùng trong cơ sở dữ liệu dựa trên decoded._id và refreshToken
    const response = await User.findOne({
      _id: rs._id,
      refreshToken: cookies.refreshToken,
    });

    if (!response) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not matched',
      });
    }

    // Tạo accessToken mới
    const newAccessToken = generateAccessToken(response._id, response.role, response.firstname, response.lastname, response.avatarUrl);

    return res.status(200).json({
      success: true,
      newAccessToken,
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken)
    throw new Error("No refresh token in cookies");
  // Xóa rếh token ở db
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    {
      new: true,
    }
  );
  // Xóa rếh token ở cookie trình duyệt
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
  return res.status(200).json({
    success: true,
    mess: "Logout successfully",
  });
});
//client gửi gmail
//Server check email có hợp lệ hay không => gửi gmail + kèm theo( password change OTP)
//Client check email
//Client gửi OTP
//Check OTP có giống với OTP mà server gửi qua email hay không
//Change pasword
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};
const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, mes: "Missing email" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, mes: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes

    // Generate salt
    const salt = bcrypt.genSaltSync(10);

    // Hash OTP with salt
    const hashedOTP = bcrypt.hashSync(otp, salt);

    // Save hashed OTP and expiry to user's record
    user.passwordResetOTP = hashedOTP;
    user.passwordResetExpires = otpExpiry;
    await user.save();

    // Email content
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555;">Hello, ${user.firstname} ${user.lastname}</p>
          <p style="color: #555;">You have requested to reset your password. Please use the OTP code below to proceed:</p>
          <p style="color: #555;">This OTP will expire in <strong>15 minutes</strong>.</p>
          <div style="font-size: 20px; font-weight: bold; margin: 20px 0; padding: 10px; background-color: #f9f9f9; border: 1px dashed #ccc; text-align: center;">
            ${otp}
          </div>
          <p style="color: #555;">If you did not request this, please ignore this email.</p>
          <p style="color: #555;">EryTan</p>
        </div>
      `;

    // Send email
    const data = {
      email,
      html,
    };

    const rs = await sendMail(data);

    return res.status(200).json({
      success: true,
      mes: rs.response?.includes("OK")
        ? "Check your mail please."
        : "Something went wrong. Please try again!!",
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({
        success: false,
        mes: "Something went wrong. Please try again!!",
      });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(400).json({ success: false, mes: "Missing input" });
  }

  try {
    // Hash OTP to compare with stored value in database

    // Find user with valid email, matching hashed OTP, and not expired
    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: Date.now() }, // Đảm bảo rằng thời gian hết hạn chưa tới
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, mes: "Invalid or expired OTP" });
    }

    // Update user's password and clear reset fields
    user.password = password;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangeAt = Date.now();

    await user.save();

    return res.status(200).json({
      success: true,
      mes: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({
        success: false,
        mes: "Something went wrong. Please try again!!",
      });
  }
});

const getUser = asyncHandler(async (req, res) => {
  const response = await User.find().select("-refreshToken -password -role");
  return res.status(200).json({
    success: response ? true : false,
    user: response,
  });
});
const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) throw new Error("missing input id");
  const response = await User.findByIdAndDelete(_id);
  return res.status(200).json({
    success: response ? true : false,
    deleteUer: response
      ? `user with email : ${response.email} deleted !!`
      : "No user delete",
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  if (!_id || Object.keys(req.body).length === 0) {
    throw new Error("Missing input id or body");
  }

  const response = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  }).select("-password -role -refreshToken");

  if (!response) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }

  return res.status(200).json({
    success: true,
    updateUser: response,
  });
});
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params; // Sử dụng uid từ req.params

  if (!uid || Object.keys(req.body).length === 0) {
    throw new Error("Missing input id or body");
  }

  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select("-password -role");

  if (!response) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }

  return res.status(200).json({
    success: true,
    updateUser: response, // Thay đổi deleteUer thành updateUser
  });
});
const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.body.address) throw new Error("Missing input");
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: req.body.address } },
    { new: true }
  ).select("-password -role -refreshToken");
  return res.status(200).json({
    mes: response ? true : false,
    updateAddress: response ? response : "Can not update address",
  });
});

module.exports = {
  login,
  refreshAccessToken,
  logout,
  generateOTP,
  forgetPassword,
  resetPassword,
  getUser,
  deleteUser,
  updateUser,
  updateUserByAdmin,
  updateUserAddress,
  register,
  getCurrent,
  uploadAvatar,
  refreshAccessToken,
}