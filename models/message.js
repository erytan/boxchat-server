const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  message: {
    type: String,
    required: true,
  },
   status: {
    type: String,
    enum: ['sent', 'received', 'read'], // Chỉ chấp nhận 3 trạng thái
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
},
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);