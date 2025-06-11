// utils/token.js
const jwt = require('jsonwebtoken');

function verifyTokenUtil(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
}

module.exports = { verifyTokenUtil };