const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Course', 'Documentation', 'Video', 'Book', 'Article', 'Project', 'Tutorial', 'Workshop'],
    required: true
  },
  category: {
    type: String,
    enum: ['Programming', 'Design', 'Data Science', 'DevOps', 'Business', 'Soft Skills', 'Other'],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  duration: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    enum: ['YouTube', 'Udemy', 'Coursera', 'edX', 'GitHub', 'Official Docs', 'Medium', 'Dev.to', 'Other'],
    trim: true
  },
  language: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      review: {
        type: String,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  thumbnail: {
    type: String,
    default: ''
  },
  prerequisites: [String],
  learningOutcomes: [String],
  languages: [String], // For courses that support multiple languages
  certificate: {
    type: Boolean,
    default: false
  },
  community: {
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        required: true,
        maxlength: 1000
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resourceSchema.index({ category: 1, difficulty: 1 });
resourceSchema.index({ type: 1, platform: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ skills: 1 });
resourceSchema.index({ 'rating.average': -1 });
resourceSchema.index({ isFeatured: 1 });
resourceSchema.index({ isFree: 1 });

// Method to add rating
resourceSchema.methods.addRating = function(userId, rating, review = '') {
  // Check if user already rated
  const existingReview = this.rating.reviews.find(r => r.user.toString() === userId.toString());
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.review = review;
    existingReview.createdAt = new Date();
  } else {
    // Add new review
    this.rating.reviews.push({
      user: userId,
      rating,
      review,
      createdAt: new Date()
    });
  }
  
  // Recalculate average rating
  const totalRating = this.rating.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.rating.reviews.length;
  this.rating.count = this.rating.reviews.length;
};

// Method to toggle bookmark
resourceSchema.methods.toggleBookmark = function(userId) {
  const bookmarkIndex = this.bookmarks.indexOf(userId);
  
  if (bookmarkIndex > -1) {
    this.bookmarks.splice(bookmarkIndex, 1);
    return false; // removed
  } else {
    this.bookmarks.push(userId);
    return true; // added
  }
};

// Method to increment views
resourceSchema.methods.incrementViews = function() {
  this.views += 1;
};

// Method to add comment
resourceSchema.methods.addComment = function(userId, content) {
  this.community.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
    likes: []
  });
};

// Method to like/unlike comment
resourceSchema.methods.toggleCommentLike = function(commentId, userId) {
  const comment = this.community.comments.id(commentId);
  if (!comment) return false;
  
  const likeIndex = comment.likes.indexOf(userId);
  if (likeIndex > -1) {
    comment.likes.splice(likeIndex, 1);
    return false; // unliked
  } else {
    comment.likes.push(userId);
    return true; // liked
  }
};

// Virtual for bookmark count
resourceSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks.length;
});

// Virtual for comment count
resourceSchema.virtual('commentCount').get(function() {
  return this.community.comments.length;
});

// Ensure virtual fields are serialized
resourceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema); 