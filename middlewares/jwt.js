const jwt = require('jsonwebtoken');
const generateAccessToken = (uid, role,firstname, lastname,avatarUrl) => jwt.sign({ _id: uid, role, firstname, lastname,avatarUrl }, process.env.JWT_SECRET, { expiresIn: '7d' })
const generateRefreshToken = (uid) => jwt.sign({ _id: uid }, process.env.JWT_SECRET, { expiresIn: '6d' })


module.exports = {
    generateAccessToken,
    generateRefreshToken
}