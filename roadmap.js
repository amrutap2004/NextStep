const express = require('express');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const aiService = require('../services/aiService');
const router = express.Router();

// Generate new roadmap
router.post('/generate', async (req, res) => {
  try {
    const { targetRole, timeFrame } = req.body;

    if (!targetRole || !timeFrame) {
      return res.status(400).json({ 
        error: 'Target role and time frame are required' 
      });
    }

    // Get user profile for AI
    const user = await User.findById(req.user._id)
      .select('skills experienceLevel interests careerGoals currentRole');

    // Generate roadmap using AI
    const roadmapData = await aiService.generateRoadmap(user, targetRole, timeFrame);

    // Create roadmap in database
    const roadmap = new Roadmap({
      user: req.user._id,
      ...roadmapData
    });

    await roadmap.save();

    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap
    });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({ 
      error: 'Failed to generate roadmap' 
    });
  }
});

// Get user's roadmaps
router.get('/', async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const roadmaps = await Roadmap.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user', 'firstName lastName avatar');

    const total = await Roadmap.countDocuments(query);

    res.json({
      roadmaps,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching roadmaps' 
    });
  }
});

// Get specific roadmap
router.get('/:id', async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'firstName lastName avatar');

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    res.json({
      roadmap
    });

  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching roadmap' 
    });
  }
});

// Update roadmap progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { stepIndex, progress, isCompleted, notes } = req.body;

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) {
      return res.status(400).json({ 
        error: 'Invalid step index' 
      });
    }

    const step = roadmap.steps[stepIndex];

    // Update step progress
    if (progress !== undefined) {
      step.progress = Math.max(0, Math.min(100, progress));
    }

    if (isCompleted !== undefined) {
      step.isCompleted = isCompleted;
      if (isCompleted) {
        step.completedAt = new Date();
        step.progress = 100;
      } else {
        step.completedAt = null;
      }
    }

    if (notes) {
      step.notes.push({
        content: notes,
        createdAt: new Date()
      });
    }

    // Recalculate overall progress
    roadmap.calculateProgress();

    await roadmap.save();

    res.json({
      message: 'Progress updated successfully',
      roadmap
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating progress' 
    });
  }
});

// Complete step
router.post('/:id/steps/:stepIndex/complete', async (req, res) => {
  try {
    const { stepIndex } = req.params;
    const { notes } = req.body;

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    roadmap.completeStep(parseInt(stepIndex));

    if (notes) {
      roadmap.addNoteToStep(parseInt(stepIndex), notes);
    }

    await roadmap.save();

    res.json({
      message: 'Step completed successfully',
      roadmap
    });

  } catch (error) {
    console.error('Complete step error:', error);
    res.status(500).json({ 
      error: 'Internal server error while completing step' 
    });
  }
});

// Update roadmap status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'completed', 'paused', 'abandoned'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { status },
      { new: true }
    );

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    res.json({
      message: 'Status updated successfully',
      roadmap
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating status' 
    });
  }
});

// Add note to step
router.post('/:id/steps/:stepIndex/notes', async (req, res) => {
  try {
    const { stepIndex } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: 'Note content is required' 
      });
    }

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    roadmap.addNoteToStep(parseInt(stepIndex), content);
    await roadmap.save();

    res.json({
      message: 'Note added successfully',
      step: roadmap.steps[parseInt(stepIndex)]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      error: 'Internal server error while adding note' 
    });
  }
});

// Get roadmap statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    const stats = {
      totalSteps: roadmap.steps.length,
      completedSteps: roadmap.steps.filter(step => step.isCompleted).length,
      overallProgress: roadmap.overallProgress,
      currentStep: roadmap.currentStep,
      estimatedCompletion: roadmap.estimatedDuration,
      startedAt: roadmap.startedAt,
      completionDate: roadmap.completionDate,
      status: roadmap.status
    };

    // Calculate time spent
    if (roadmap.startedAt) {
      const now = new Date();
      const startDate = new Date(roadmap.startedAt);
      stats.timeSpent = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)); // days
    }

    res.json({
      stats
    });

  } catch (error) {
    console.error('Get roadmap stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching roadmap statistics' 
    });
  }
});

// Delete roadmap
router.delete('/:id', async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    res.json({
      message: 'Roadmap deleted successfully'
    });

  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting roadmap' 
    });
  }
});

// Get public roadmaps (for inspiration)
router.get('/public/inspiration', async (req, res) => {
  try {
    const { careerPath, limit = 10 } = req.query;
    
    const query = { isPublic: true };
    if (careerPath) {
      query.careerPath = careerPath;
    }

    const roadmaps = await Roadmap.find(query)
      .sort({ likes: -1, shares: -1 })
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName avatar')
      .select('-steps');

    res.json({
      roadmaps
    });

  } catch (error) {
    console.error('Get public roadmaps error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching public roadmaps' 
    });
  }
});

// Like/unlike roadmap
router.post('/:id/like', async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    const likeIndex = roadmap.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      roadmap.likes.splice(likeIndex, 1);
    } else {
      roadmap.likes.push(req.user._id);
    }

    await roadmap.save();

    res.json({
      message: likeIndex > -1 ? 'Roadmap unliked' : 'Roadmap liked',
      likes: roadmap.likes.length
    });

  } catch (error) {
    console.error('Like roadmap error:', error);
    res.status(500).json({ 
      error: 'Internal server error while liking roadmap' 
    });
  }
});

// Share roadmap
router.post('/:id/share', async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ 
        error: 'Roadmap not found' 
      });
    }

    roadmap.shares += 1;
    await roadmap.save();

    res.json({
      message: 'Roadmap shared successfully',
      shares: roadmap.shares
    });

  } catch (error) {
    console.error('Share roadmap error:', error);
    res.status(500).json({ 
      error: 'Internal server error while sharing roadmap' 
    });
  }
});

module.exports = router; 