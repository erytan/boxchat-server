const router = require('express').Router();
const { getMessages } = require('../controllers/message');
const { verifyAccessToken } = require('../middlewares/verifyToken');

router.get('/', verifyAccessToken, getMessages);

module.exports = router;