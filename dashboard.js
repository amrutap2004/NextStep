const express = require('express');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Resource = require('../models/Resource');
const Message = require('../models/Message');
const aiService = require('../services/aiService');
const router = express.Router();

// Get comprehensive dashboard data
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with populated data
    const user = await User.findById(userId)
      .populate('bookmarks', 'title description url type category')
      .populate('connections.user', 'firstName lastName avatar isMentor mentorProfile');

    // Get user's roadmaps
    const roadmaps = await Roadmap.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent resources
    const recentResources = await Resource.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('rating.reviews.user', 'firstName lastName avatar');

    // Get unread messages count
    const unreadCount = await Message.getUnreadCount(userId);

    // Calculate skill statistics
    const skillStats = {
      totalSkills: user.skills.length,
      byLevel: {
        Beginner: 0,
        Intermediate: 0,
        Advanced: 0,
        Expert: 0
      },
      byCategory: {},
      averageExperience: 0
    };

    let totalExperience = 0;
    user.skills.forEach(skill => {
      skillStats.byLevel[skill.level]++;
      if (!skillStats.byCategory[skill.category]) {
        skillStats.byCategory[skill.category] = 0;
      }
      skillStats.byCategory[skill.category]++;
      totalExperience += skill.yearsOfExperience || 0;
    });

    skillStats.averageExperience = user.skills.length > 0 ? 
      Math.round((totalExperience / user.skills.length) * 10) / 10 : 0;

    // Calculate roadmap statistics
    const roadmapStats = {
      total: roadmaps.length,
      active: roadmaps.filter(r => r.status === 'active').length,
      completed: roadmaps.filter(r => r.status === 'completed').length,
      averageProgress: 0
    };

    if (roadmaps.length > 0) {
      const totalProgress = roadmaps.reduce((sum, roadmap) => sum + roadmap.overallProgress, 0);
      roadmapStats.averageProgress = Math.round(totalProgress / roadmaps.length);
    }

    // Get recommended skills (if user has less than 5 skills)
    let skillRecommendations = [];
    if (user.skills.length < 5) {
      try {
        const recommendations = await aiService.recommendSkills(user, 'General Development');
        skillRecommendations = recommendations.recommendedSkills || [];
      } catch (error) {
        console.error('Failed to get skill recommendations:', error);
      }
    }

    // Get learning insights
    const insights = {
      nextSteps: [],
      achievements: [],
      recommendations: []
    };

    // Generate next steps based on current skills and goals
    if (user.careerGoals.length > 0) {
      insights.nextSteps = [
        {
          title: "Complete your first roadmap",
          description: "Start with a roadmap aligned with your career goals",
          priority: "high"
        },
        {
          title: "Add more skills to your profile",
          description: "Expand your skill set to increase opportunities",
          priority: "medium"
        },
        {
          title: "Connect with mentors",
          description: "Find mentors in your target field for guidance",
          priority: "medium"
        }
      ];
    }

    // Generate achievements based on user activity
    if (user.skills.length >= 3) {
      insights.achievements.push({
        title: "Skill Collector",
        description: "Added 3+ skills to your profile",
        icon: "🎯"
      });
    }

    if (roadmaps.length > 0) {
      insights.achievements.push({
        title: "Roadmap Explorer",
        description: "Created your first career roadmap",
        icon: "🗺️"
      });
    }

    if (user.bookmarks.length >= 5) {
      insights.achievements.push({
        title: "Resource Curator",
        description: "Bookmarked 5+ learning resources",
        icon: "📚"
      });
    }

    // Generate recommendations
    insights.recommendations = [
      {
        type: "skill",
        title: "Consider learning React",
        description: "Based on your web development interests",
        action: "Add React to your skills"
      },
      {
        type: "roadmap",
        title: "Start a Full-Stack Development roadmap",
        description: "Aligns with your career goals",
        action: "Generate roadmap"
      },
      {
        type: "resource",
        title: "Check out these JavaScript courses",
        description: "Popular resources in your field",
        action: "Browse resources"
      }
    ];

    // Get recent activity
    const recentActivity = [];

    // Add roadmap activities
    roadmaps.forEach(roadmap => {
      if (roadmap.overallProgress > 0) {
        recentActivity.push({
          type: "roadmap_progress",
          title: `Made progress on ${roadmap.title}`,
          description: `${roadmap.overallProgress}% completed`,
          timestamp: roadmap.updatedAt,
          data: { roadmapId: roadmap._id }
        });
      }
    });

    // Add skill activities
    if (user.skills.length > 0) {
      recentActivity.push({
        type: "skill_added",
        title: "Updated skills profile",
        description: `${user.skills.length} skills listed`,
        timestamp: user.updatedAt,
        data: { skillCount: user.skills.length }
      });
    }

    // Sort activities by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get quick stats
    const quickStats = {
      totalSkills: user.skills.length,
      activeRoadmaps: roadmapStats.active,
      bookmarkedResources: user.bookmarks.length,
      unreadMessages: unreadCount,
      connections: user.connections.filter(c => c.status === 'accepted').length,
      daysActive: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
    };

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        experienceLevel: user.experienceLevel,
        currentRole: user.currentRole,
        interests: user.interests,
        careerGoals: user.careerGoals
      },
      skills: {
        list: user.skills,
        stats: skillStats,
        recommendations: skillRecommendations
      },
      roadmaps: {
        list: roadmaps,
        stats: roadmapStats
      },
      resources: {
        recent: recentResources,
        bookmarked: user.bookmarks
      },
      connections: user.connections,
      insights,
      recentActivity: recentActivity.slice(0, 10),
      quickStats,
      unreadMessages: unreadCount
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching dashboard data' 
    });
  }
});

// Get dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get roadmap analytics
    const roadmapAnalytics = await Roadmap.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          avgProgress: { $avg: "$overallProgress" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get skill growth analytics
    const skillAnalytics = await User.aggregate([
      {
        $match: { _id: userId }
      },
      {
        $project: {
          skills: 1,
          createdAt: 1
        }
      }
    ]);

    // Get resource engagement analytics
    const resourceAnalytics = await Resource.aggregate([
      {
        $match: {
          bookmarks: userId,
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          bookmarks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate learning velocity
    const learningVelocity = {
      roadmapsCreated: roadmapAnalytics.length,
      averageProgress: roadmapAnalytics.length > 0 ? 
        roadmapAnalytics.reduce((sum, item) => sum + item.avgProgress, 0) / roadmapAnalytics.length : 0,
      resourcesBookmarked: resourceAnalytics.length,
      skillsAdded: skillAnalytics[0]?.skills?.length || 0
    };

    res.json({
      roadmapAnalytics,
      resourceAnalytics,
      learningVelocity,
      period: parseInt(period)
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching analytics' 
    });
  }
});

// Get personalized recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const recommendations = {
      skills: [],
      roadmaps: [],
      resources: [],
      mentors: []
    };

    // Skill recommendations based on career goals
    if (user.careerGoals.length > 0) {
      try {
        const skillRecs = await aiService.recommendSkills(user, user.careerGoals[0]);
        recommendations.skills = skillRecs.recommendedSkills || [];
      } catch (error) {
        console.error('Failed to get skill recommendations:', error);
      }
    }

    // Roadmap recommendations
    const popularRoadmaps = await Roadmap.find({ isPublic: true })
      .sort({ likes: -1, shares: -1 })
      .limit(3)
      .populate('user', 'firstName lastName avatar')
      .select('-steps');

    recommendations.roadmaps = popularRoadmaps;

    // Resource recommendations based on user skills
    const userSkillNames = user.skills.map(s => s.name);
    const skillResources = await Resource.find({
      skills: { $in: userSkillNames }
    })
      .sort({ 'rating.average': -1 })
      .limit(6)
      .populate('rating.reviews.user', 'firstName lastName avatar');

    recommendations.resources = skillResources;

    // Mentor recommendations
    const potentialMentors = await User.find({
      isMentor: true,
      'mentorProfile.expertise': { $in: user.interests }
    })
      .select('firstName lastName avatar mentorProfile')
      .limit(5);

    recommendations.mentors = potentialMentors;

    res.json({
      recommendations
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching recommendations' 
    });
  }
});

// Get learning progress summary
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user roadmaps
    const roadmaps = await Roadmap.find({ user: userId });

    const progress = {
      totalRoadmaps: roadmaps.length,
      activeRoadmaps: roadmaps.filter(r => r.status === 'active').length,
      completedRoadmaps: roadmaps.filter(r => r.status === 'completed').length,
      averageProgress: 0,
      totalSteps: 0,
      completedSteps: 0,
      timeSpent: 0,
      milestones: []
    };

    if (roadmaps.length > 0) {
      // Calculate overall progress
      const totalProgress = roadmaps.reduce((sum, roadmap) => sum + roadmap.overallProgress, 0);
      progress.averageProgress = Math.round(totalProgress / roadmaps.length);

      // Calculate steps
      roadmaps.forEach(roadmap => {
        progress.totalSteps += roadmap.steps.length;
        progress.completedSteps += roadmap.steps.filter(step => step.isCompleted).length;
      });

      // Calculate time spent
      const now = new Date();
      roadmaps.forEach(roadmap => {
        if (roadmap.startedAt) {
          const startDate = new Date(roadmap.startedAt);
          progress.timeSpent += Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        }
      });

      // Generate milestones
      if (progress.completedSteps >= 5) {
        progress.milestones.push({
          title: "First Steps",
          description: "Completed 5 learning steps",
          achieved: true,
          icon: "🎯"
        });
      }

      if (progress.completedRoadmaps >= 1) {
        progress.milestones.push({
          title: "Roadmap Master",
          description: "Completed your first roadmap",
          achieved: true,
          icon: "🏆"
        });
      }

      if (progress.averageProgress >= 50) {
        progress.milestones.push({
          title: "Halfway There",
          description: "Reached 50% average progress",
          achieved: true,
          icon: "📈"
        });
      }
    }

    res.json({
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching progress' 
    });
  }
});

module.exports = router; 