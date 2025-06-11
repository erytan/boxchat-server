const router = require('express').Router()
const ctrls = require('../controllers/mission')
const { verifyAccessToken } = require('../middlewares/verifyToken')


router.post('/create-mission', [verifyAccessToken], ctrls.createMission);
router.put("/:sid", [verifyAccessToken], ctrls.updateMission);
router.delete("/:id", [verifyAccessToken], ctrls.deleteMission);
router.get("/", ctrls.getMission);

module.exports = router