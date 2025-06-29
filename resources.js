const express = require('express');
const Resource = require('../models/Resource');
const User = require('../models/User');
const router = express.Router();

// Get all resources with filtering
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      difficulty,
      platform,
      isFree,
      search,
      sort = 'rating',
      limit = 20,
      page = 1
    } = req.query;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (platform) query.platform = platform;
    if (isFree !== undefined) query.isFree = isFree === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'rating':
        sortQuery = { 'rating.average': -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'popular':
        sortQuery = { views: -1 };
        break;
      case 'bookmarks':
        sortQuery = { bookmarkCount: -1 };
        break;
      default:
        sortQuery = { 'rating.average': -1 };
    }

    const resources = await Resource.find(query)
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('rating.reviews.user', 'firstName lastName avatar');

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching resources' 
    });
  }
});

// Get featured resources
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const resources = await Resource.find({ isFeatured: true })
      .sort({ 'rating.average': -1, views: -1 })
      .limit(parseInt(limit))
      .populate('rating.reviews.user', 'firstName lastName avatar');

    res.json({
      resources
    });

  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching featured resources' 
    });
  }
});

// Get specific resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('rating.reviews.user', 'firstName lastName avatar')
      .populate('community.comments.user', 'firstName lastName avatar');

    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    // Increment views
    resource.incrementViews();
    await resource.save();

    // Check if user has bookmarked this resource
    const isBookmarked = req.user.bookmarks.includes(resource._id);

    res.json({
      resource,
      isBookmarked
    });

  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching resource' 
    });
  }
});

// Bookmark/unbookmark resource
router.post('/:id/bookmark', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    const user = await User.findById(req.user._id);
    const isBookmarked = resource.toggleBookmark(req.user._id);
    
    if (isBookmarked) {
      user.bookmarks.push(resource._id);
    } else {
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== resource._id.toString());
    }

    await Promise.all([resource.save(), user.save()]);

    res.json({
      message: isBookmarked ? 'Resource bookmarked' : 'Resource unbookmarked',
      isBookmarked
    });

  } catch (error) {
    console.error('Bookmark resource error:', error);
    res.status(500).json({ 
      error: 'Internal server error while bookmarking resource' 
    });
  }
});

// Rate resource
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    resource.addRating(req.user._id, rating, review);
    await resource.save();

    res.json({
      message: 'Rating added successfully',
      rating: resource.rating
    });

  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({ 
      error: 'Internal server error while rating resource' 
    });
  }
});

// Add comment to resource
router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: 'Comment content is required' 
      });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    resource.addComment(req.user._id, content);
    await resource.save();

    // Populate the new comment
    await resource.populate('community.comments.user', 'firstName lastName avatar');

    const newComment = resource.community.comments[resource.community.comments.length - 1];

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      error: 'Internal server error while adding comment' 
    });
  }
});

// Like/unlike comment
router.post('/:id/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ 
        error: 'Resource not found' 
      });
    }

    const isLiked = resource.toggleCommentLike(commentId, req.user._id);
    await resource.save();

    res.json({
      message: isLiked ? 'Comment liked' : 'Comment unliked',
      isLiked
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ 
      error: 'Internal server error while liking comment' 
    });
  }
});

// Get user's bookmarks
router.get('/bookmarks/user', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        options: {
          limit: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit)
        }
      });

    const total = user.bookmarks.length;

    res.json({
      resources: user.bookmarks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching bookmarks' 
    });
  }
});

// Get resources by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const resources = await Resource.find({ category })
      .sort({ 'rating.average': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('rating.reviews.user', 'firstName lastName avatar');

    const total = await Resource.countDocuments({ category });

    res.json({
      category,
      resources,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get resources by category error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching resources by category' 
    });
  }
});

// Get resources by skill
router.get('/skill/:skill', async (req, res) => {
  try {
    const { skill } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const resources = await Resource.find({
      skills: { $regex: skill, $options: 'i' }
    })
      .sort({ 'rating.average': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('rating.reviews.user', 'firstName lastName avatar');

    const total = await Resource.countDocuments({
      skills: { $regex: skill, $options: 'i' }
    });

    res.json({
      skill,
      resources,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get resources by skill error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching resources by skill' 
    });
  }
});

// Get resource statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = {
      totalResources: await Resource.countDocuments(),
      byCategory: {},
      byType: {},
      byDifficulty: {},
      byPlatform: {},
      averageRating: 0,
      totalBookmarks: 0,
      totalViews: 0
    };

    // Aggregate statistics
    const categoryStats = await Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const typeStats = await Resource.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const difficultyStats = await Resource.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    const platformStats = await Resource.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    const ratingStats = await Resource.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
    ]);

    const bookmarkStats = await Resource.aggregate([
      { $group: { _id: null, totalBookmarks: { $sum: { $size: '$bookmarks' } } } }
    ]);

    const viewStats = await Resource.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    // Format results
    categoryStats.forEach(stat => {
      stats.byCategory[stat._id] = stat.count;
    });

    typeStats.forEach(stat => {
      stats.byType[stat._id] = stat.count;
    });

    difficultyStats.forEach(stat => {
      stats.byDifficulty[stat._id] = stat.count;
    });

    platformStats.forEach(stat => {
      stats.byPlatform[stat._id] = stat.count;
    });

    stats.averageRating = ratingStats[0]?.avgRating || 0;
    stats.totalBookmarks = bookmarkStats[0]?.totalBookmarks || 0;
    stats.totalViews = viewStats[0]?.totalViews || 0;

    res.json({
      stats
    });

  } catch (error) {
    console.error('Get resource stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching resource statistics' 
    });
  }
});

module.exports = router; 