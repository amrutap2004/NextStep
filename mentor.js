const express = require('express');
const aiService = require('../services/aiService');
const User = require('../models/User');
const Message = require('../models/Message');
const router = express.Router();

// Chat with AI mentor
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Get user profile for AI context
    const user = await User.findById(req.user._id)
      .select('skills experienceLevel interests careerGoals currentRole');

    // Get AI response
    const aiResponse = await aiService.chatWithMentor(user, message, conversationHistory);

    // Save conversation to database (optional - for analytics)
    const conversation = {
      user: req.user._id,
      message,
      response: aiResponse.response,
      tokens: aiResponse.tokens,
      timestamp: new Date()
    };

    res.json({
      message: 'AI mentor response generated',
      response: aiResponse.response,
      tokens: aiResponse.tokens,
      conversation
    });

  } catch (error) {
    console.error('AI mentor chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI mentor response' 
    });
  }
});

// Get chat history (if stored)
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    // This would typically fetch from a conversation history collection
    // For now, we'll return an empty array as conversations aren't stored
    const conversations = [];
    const total = 0;

    res.json({
      conversations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chat history' 
    });
  }
});

// Get skill recommendations from AI
router.post('/recommendations', async (req, res) => {
  try {
    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({ 
        error: 'Target role is required' 
      });
    }

    // Get user profile
    const user = await User.findById(req.user._id)
      .select('skills experienceLevel interests');

    // Get AI recommendations
    const recommendations = await aiService.recommendSkills(user, targetRole);

    res.json({
      message: 'Skill recommendations generated',
      recommendations
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate skill recommendations' 
    });
  }
});

// Analyze learning progress
router.post('/analyze-progress', async (req, res) => {
  try {
    const { completedSteps, currentStep } = req.body;

    // Get user profile
    const user = await User.findById(req.user._id)
      .select('skills experienceLevel interests');

    // Get AI analysis
    const analysis = await aiService.analyzeProgress(user, completedSteps, currentStep);

    res.json({
      message: 'Progress analysis generated',
      analysis
    });

  } catch (error) {
    console.error('Analyze progress error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze progress' 
    });
  }
});

// Get mentorship tips
router.get('/tips', async (req, res) => {
  try {
    const { category } = req.query;

    const tips = [
      {
        id: 1,
        title: "Set Clear Goals",
        content: "Define specific, measurable career goals with realistic timelines.",
        category: "general",
        tags: ["planning", "goals"]
      },
      {
        id: 2,
        title: "Build a Learning Routine",
        content: "Dedicate consistent time each day or week to skill development.",
        category: "learning",
        tags: ["routine", "consistency"]
      },
      {
        id: 3,
        title: "Practice Regularly",
        content: "Apply what you learn through projects, coding challenges, or real-world applications.",
        category: "practice",
        tags: ["projects", "application"]
      },
      {
        id: 4,
        title: "Network Actively",
        content: "Connect with professionals in your target field through LinkedIn, meetups, and conferences.",
        category: "networking",
        tags: ["connections", "community"]
      },
      {
        id: 5,
        title: "Stay Updated",
        content: "Follow industry trends, read blogs, and subscribe to relevant newsletters.",
        category: "trends",
        tags: ["industry", "knowledge"]
      }
    ];

    const filteredTips = category ? 
      tips.filter(tip => tip.category === category) : 
      tips;

    res.json({
      tips: filteredTips
    });

  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching tips' 
    });
  }
});

// Get career insights
router.get('/insights', async (req, res) => {
  try {
    const { field } = req.query;

    const insights = [
      {
        id: 1,
        title: "Web Development Trends",
        content: "React, Vue, and Angular continue to dominate frontend development. Full-stack developers with cloud knowledge are in high demand.",
        field: "web-development",
        tags: ["frontend", "fullstack", "cloud"]
      },
      {
        id: 2,
        title: "Data Science Growth",
        content: "Machine learning and AI skills are increasingly valuable. Python and R remain the primary languages for data science.",
        field: "data-science",
        tags: ["machine-learning", "python", "ai"]
      },
      {
        id: 3,
        title: "DevOps Evolution",
        content: "Containerization with Docker and orchestration with Kubernetes are essential skills. CI/CD pipelines are standard practice.",
        field: "devops",
        tags: ["docker", "kubernetes", "ci-cd"]
      }
    ];

    const filteredInsights = field ? 
      insights.filter(insight => insight.field === field) : 
      insights;

    res.json({
      insights: filteredInsights
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching insights' 
    });
  }
});

// Get personalized advice
router.post('/advice', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    // Get user profile
    const user = await User.findById(req.user._id)
      .select('skills experienceLevel interests careerGoals currentRole');

    // Create a more specific prompt for advice
    const advicePrompt = `
User Question: ${question}
Context: ${context || 'No additional context provided'}

User Background:
- Current Role: ${user.currentRole || 'Not specified'}
- Experience Level: ${user.experienceLevel}
- Skills: ${user.skills.map(s => `${s.name} (${s.level})`).join(', ')}
- Interests: ${user.interests.join(', ')}
- Career Goals: ${user.careerGoals.join(', ')}

Please provide personalized advice that addresses their specific question and takes into account their background and goals.`;

    // Get AI advice
    const aiResponse = await aiService.chatWithMentor(user, advicePrompt);

    res.json({
      message: 'Personalized advice generated',
      advice: aiResponse.response,
      question,
      context
    });

  } catch (error) {
    console.error('Get advice error:', error);
    res.status(500).json({ 
      error: 'Failed to generate personalized advice' 
    });
  }
});

module.exports = router; 