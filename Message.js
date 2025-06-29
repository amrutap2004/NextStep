const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  conversationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ isRead: 1 });

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    createdAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
};

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(user1Id, user2Id) {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to get conversation messages
messageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50, skip = 0) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  return this.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'firstName lastName avatar')
    .populate('receiver', 'firstName lastName avatar')
    .populate('replyTo', 'content sender')
    .lean();
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false
  });
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(user1Id, user2Id) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  return this.updateMany(
    {
      conversationId,
      receiver: user1Id,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

module.exports = mongoose.model('Message', messageSchema); 