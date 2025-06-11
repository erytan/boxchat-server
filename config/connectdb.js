const { default: mongoose } = require('mongoose')
mongoose.set('strictQuery', false)
const dbConnect = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        if (conn.connection.readyState === 1)
            console.log('Connected to mongodb')
        else
            console.log('Failed to connect')
    } catch (error) {
        console.log('Error connecting to Mongo')
        throw new Error(error)
    }
}
module.exports = dbConnect