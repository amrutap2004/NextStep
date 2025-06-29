const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

class SocketService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socket
    this.userSockets = new Map(); // socketId -> userId
  }

  setupSocketHandlers(io) {
    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      
      this.handleConnection(socket, io);
      
      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Join private room for user
      socket.join(`user_${socket.userId}`);

      // Handle joining mentorship room
      socket.on('join_mentorship', (mentorId) => {
        socket.join(`mentorship_${socket.userId}_${mentorId}`);
        console.log(`User ${socket.userId} joined mentorship room with ${mentorId}`);
      });

      // Handle leaving mentorship room
      socket.on('leave_mentorship', (mentorId) => {
        socket.leave(`mentorship_${socket.userId}_${mentorId}`);
        console.log(`User ${socket.userId} left mentorship room with ${mentorId}`);
      });

      // Handle private messages
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data, io);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data, io);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data, io);
      });

      // Handle message read receipts
      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data, io);
      });

      // Handle online status
      socket.on('set_status', (status) => {
        this.handleSetStatus(socket, status, io);
      });

      // Handle mentorship requests
      socket.on('mentorship_request', async (data) => {
        await this.handleMentorshipRequest(socket, data, io);
      });

      // Handle mentorship response
      socket.on('mentorship_response', async (data) => {
        await this.handleMentorshipResponse(socket, data, io);
      });

      // Handle video call signaling
      socket.on('call_signal', (data) => {
        this.handleCallSignal(socket, data, io);
      });

      // Handle call accept/reject
      socket.on('call_response', (data) => {
        this.handleCallResponse(socket, data, io);
      });

      // Handle call end
      socket.on('end_call', (data) => {
        this.handleEndCall(socket, data, io);
      });
    });
  }

  handleConnection(socket, io) {
    // Store user connection
    this.connectedUsers.set(socket.userId.toString(), socket);
    this.userSockets.set(socket.id, socket.userId.toString());

    // Update user's online status
    this.updateUserStatus(socket.userId, 'online');

    // Notify other users about online status
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status: 'online',
      lastSeen: new Date()
    });

    // Send user their unread message count
    this.sendUnreadCount(socket);
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Remove from connected users
    this.connectedUsers.delete(socket.userId.toString());
    this.userSockets.delete(socket.id);

    // Update user's offline status
    this.updateUserStatus(socket.userId, 'offline');

    // Notify other users about offline status
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status: 'offline',
      lastSeen: new Date()
    });
  }

  async handleSendMessage(socket, data, io) {
    try {
      const { receiverId, content, messageType = 'text', attachments = [] } = data;

      // Validate receiver
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }

      // Create message
      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content,
        messageType,
        attachments,
        conversationId: Message.generateConversationId(socket.userId, receiverId)
      });

      await message.save();

      // Populate sender info
      await message.populate('sender', 'firstName lastName avatar');

      // Send to receiver if online
      const receiverSocket = this.connectedUsers.get(receiverId.toString());
      if (receiverSocket) {
        receiverSocket.emit('new_message', {
          message,
          conversationId: message.conversationId
        });
      }

      // Send confirmation to sender
      socket.emit('message_sent', {
        message,
        conversationId: message.conversationId
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket, data, io) {
    const { receiverId } = data;
    const receiverSocket = this.connectedUsers.get(receiverId.toString());
    
    if (receiverSocket) {
      receiverSocket.emit('typing_start', {
        userId: socket.userId,
        conversationId: Message.generateConversationId(socket.userId, receiverId)
      });
    }
  }

  handleTypingStop(socket, data, io) {
    const { receiverId } = data;
    const receiverSocket = this.connectedUsers.get(receiverId.toString());
    
    if (receiverSocket) {
      receiverSocket.emit('typing_stop', {
        userId: socket.userId,
        conversationId: Message.generateConversationId(socket.userId, receiverId)
      });
    }
  }

  async handleMarkRead(socket, data, io) {
    try {
      const { senderId } = data;
      
      // Mark messages as read
      await Message.markConversationAsRead(socket.userId, senderId);

      // Notify sender that messages were read
      const senderSocket = this.connectedUsers.get(senderId.toString());
      if (senderSocket) {
        senderSocket.emit('messages_read', {
          userId: socket.userId,
          conversationId: Message.generateConversationId(socket.userId, senderId)
        });
      }

    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  handleSetStatus(socket, status, io) {
    this.updateUserStatus(socket.userId, status);
    
    socket.broadcast.emit('user_status_change', {
      userId: socket.userId,
      status,
      lastSeen: new Date()
    });
  }

  async handleMentorshipRequest(socket, data, io) {
    try {
      const { mentorId, message } = data;
      
      // Check if mentor is online
      const mentorSocket = this.connectedUsers.get(mentorId.toString());
      if (mentorSocket) {
        mentorSocket.emit('mentorship_request', {
          userId: socket.userId,
          user: socket.user,
          message,
          timestamp: new Date()
        });
      }

      // Send confirmation to requester
      socket.emit('mentorship_request_sent', {
        mentorId,
        status: 'sent'
      });

    } catch (error) {
      console.error('Mentorship request error:', error);
      socket.emit('error', { message: 'Failed to send mentorship request' });
    }
  }

  async handleMentorshipResponse(socket, data, io) {
    try {
      const { userId, response, message } = data;
      
      const userSocket = this.connectedUsers.get(userId.toString());
      if (userSocket) {
        userSocket.emit('mentorship_response', {
          mentorId: socket.userId,
          mentor: socket.user,
          response, // 'accepted' or 'rejected'
          message,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Mentorship response error:', error);
      socket.emit('error', { message: 'Failed to send mentorship response' });
    }
  }

  handleCallSignal(socket, data, io) {
    const { receiverId, signal, type } = data;
    const receiverSocket = this.connectedUsers.get(receiverId.toString());
    
    if (receiverSocket) {
      receiverSocket.emit('call_signal', {
        userId: socket.userId,
        user: socket.user,
        signal,
        type,
        timestamp: new Date()
      });
    }
  }

  handleCallResponse(socket, data, io) {
    const { userId, response } = data;
    const userSocket = this.connectedUsers.get(userId.toString());
    
    if (userSocket) {
      userSocket.emit('call_response', {
        mentorId: socket.userId,
        response, // 'accepted' or 'rejected'
        timestamp: new Date()
      });
    }
  }

  handleEndCall(socket, data, io) {
    const { userId } = data;
    const userSocket = this.connectedUsers.get(userId.toString());
    
    if (userSocket) {
      userSocket.emit('call_ended', {
        userId: socket.userId,
        timestamp: new Date()
      });
    }
  }

  async updateUserStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Update user status error:', error);
    }
  }

  async sendUnreadCount(socket) {
    try {
      const unreadCount = await Message.getUnreadCount(socket.userId);
      socket.emit('unread_count', { count: unreadCount });
    } catch (error) {
      console.error('Send unread count error:', error);
    }
  }

  // Utility methods
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  broadcastToUser(userId, event, data) {
    const userSocket = this.connectedUsers.get(userId.toString());
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  broadcastToAll(event, data) {
    this.connectedUsers.forEach(socket => {
      socket.emit(event, data);
    });
  }
}

module.exports = new SocketService(); 