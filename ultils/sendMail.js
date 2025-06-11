const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');

const sendMail = asyncHandler(async(data) => {
    const { email, html } = data; // Lấy email và nội dung HTML từ đối số data
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_NAME,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });
    let info = await transporter.sendMail({
        from: '"Điểm danh sinh viên" <no-relply@cuahanggiayda.com>',
        to: email, // Đây là người nhận email
        subject: "Forget password",
        html: html, // Đây là nội dung HTML của email
    });
    return info;
});

module.exports = sendMail