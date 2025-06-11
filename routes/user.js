const router = require('express').Router()
const ctrls = require('../controllers/user')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const { upload } = require('../middlewares/cloudinary');

router.post('/register',ctrls.register)
router.post('/login', ctrls.login)
router.post('/refreshtoken', ctrls.refreshAccessToken)
router.get('/logout', ctrls.logout)
router.post('/forgetpassword', ctrls.forgetPassword)
router.put('/resetpassword', ctrls.resetPassword)
router.get('/current', verifyAccessToken, ctrls.getCurrent)
router.post('/refreshAccessToken', ctrls.refreshAccessToken);
router.post('/avatar', [verifyAccessToken, upload.single('avatar')], ctrls.uploadAvatar);

router.put('/current', [verifyAccessToken], ctrls.updateUser)
router.put('/address', [verifyAccessToken], ctrls.updateUserAddress)

router.get('/', [verifyAccessToken], ctrls.getUser)
router.delete('/', [verifyAccessToken, isAdmin], ctrls.deleteUser)
router.put('/:uid', [verifyAccessToken, isAdmin], ctrls.updateUserByAdmin)

module.exports = router

// CRUD | Create - Read - Update - Delete | POST - GET -PUT - DELETE