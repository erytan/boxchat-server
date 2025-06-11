const Message = require('../models/message');
const Room = require('../models/room');

const chatController = (io, socket) => {
  io.emit('userData', {
    id: socket.id,
    id_user: socket.userId,
    avatarUrl:socket.user?.avatarUrl || 'Unknown',
    firstname: socket.user?.firstname || 'Unknown',
    lastname: socket.user?.lastname || 'Unknown',
  });

  socket.on("joinRoom", async (roomName, callback) => {
    try {
      if (!socket.userId) {
        socket.emit("error", { message: "Vui lòng xác thực trước khi tham gia" });
        return callback?.({
          success: false,
          message: "Vui lòng kiểm tra lại"
        });
      }
      let room = await Room.findOne({ name: roomName });
      if (!room) {
        room = new Room({ name: roomName, participants: [socket.userId] });
        await room.save();
      } else if (!room.participants.includes(socket.userId)) {
        room.participants.push(socket.userId);
        await room.save();
      }
      socket.join(roomName);
      console.log(`✅ User ${socket.userId} joined room: ${roomName}`);
      callback?.({
        success: true,
        roomId: room._id,
      });
    } catch (err) {
      console.error("Error joining room:", err.message);
      socket.emit("error", { message: "Không thể tham gia phòng" });
      callback?.({ success: false, message: "Không thể tham gia phòng" });
    }
  });

  socket.on('sendMessage', async ({ text, room }, callback) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Vui lòng xác thực' });
        return callback?.({ success: false, message: 'Vui lòng xác thực' });
      }
      if (!text || text.trim() === '') {
        socket.emit('error', { message: 'Tin nhắn không được để trống' });
        return callback?.({ success: false, message: 'Tin nhắn không được để trống' });
      }
      const roomDoc = await Room.findOne({ name: room });
      if (!roomDoc || !roomDoc.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Bạn chưa tham gia phòng này' });
        return callback?.({ success: false, message: 'Bạn chưa tham gia phòng này' });
      }

      const newMessage = new Message({
        message: text, // Lưu vào DB với trường `message`
        sender_id: socket.userId,
        room_id: roomDoc._id,
      });
      await newMessage.save();
      const populatedMessage = await Message.findById(newMessage._id).populate(
        'sender_id',
        'id_user firstname lastname avatarUrl'
      );

      console.log("📢 Tin nhắn sau khi populate:", populatedMessage);
      // Định dạng tin nhắn để khớp với API
      const formattedMessage = {
        message: populatedMessage.message,
        sender_id: populatedMessage.sender_id,
        createdAt: populatedMessage.createdAt,
        room_id: roomDoc._id,
        avatarUrl: populatedMessage.sender_id.avatarUrl, 
      };

      // Phát tin nhắn đến phòng
      io.to(room).emit('receiveMessage', formattedMessage);
      console.log(`Message sent to room ${room}: ${text}`);
      callback?.({ success: true, message: formattedMessage });
    } catch (err) {
      console.error('Error saving message:', err.message);
      socket.emit('error', { message: `Không thể gửi tin nhắn: ${err.message}` });
      callback?.({ success: false, message: `Không thể gửi tin nhắn: ${err.message}` });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    io.emit('userDisconnected', {
      id: socket.id,
      id_user: socket.userId,
      firstname: socket.user?.firstname || 'Unknown',
      lastname: socket.user?.lastname || 'Unknown',
    });
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        const roomUsers = Array.from(io.sockets.adapter.rooms.get(room) || [])
          .filter((id) => id !== socket.id)
          .map((socketId) => ({
            id: socketId,
            id_user: io.sockets.sockets.get(socketId)?.userId,
            firstname: io.sockets.sockets.get(socketId)?.user?.firstname,
            lastname: io.sockets.sockets.get(socketId)?.user?.lastname,
          }));
        io.to(room).emit('roomUsers', roomUsers);
      }
    });
  });
};

const getMessages = async (req, res) => {
  try {
    const { roomName = 'public', page = 1, limit = 20 } = req.query;
    if (!roomName) {
      return res.status(400).json({ message: 'Yêu cầu chỉ định phòng' });
    }

    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

     const messages = await Message.find({ room_id: room._id })
      .populate('sender_id', 'id_user firstname lastname avatarUrl')
      .sort({ createdAt: -1 }) // Lấy mới nhất trước
      .limit(parseInt(limit))
      .then(messages => messages.reverse()); // Đảo ngược để tin nhắn mới ở cuối


    const total = await Message.countDocuments({ room_id: room._id });

    res.status(200).json({
      messages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error loading messages:', error.message);
    res.status(500).json({ message: 'Không thể tải tin nhắn', error: error.message });
  }
};

module.exports = { chatController, getMessages };