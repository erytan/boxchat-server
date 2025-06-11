const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    createdAt: {
        type: Date,
        default: Date.now,
    },

},
    { timestamps: true }
);
module.exports = mongoose.model('Room', roomSchema);