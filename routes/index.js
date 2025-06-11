const { notFound, errHandler } = require('../middlewares/errHandler')
const userRouter = require('./user')
const messageRouter = require('./message')
const missionRouter = require('./mission')



const initRoutes = (app) => {
    app.use('/api/user', userRouter)
    app.use('/api/message', messageRouter)
    app.use('/api/mission', missionRouter)


    app.use(notFound)
    app.use(errHandler)
}
module.exports = initRoutes