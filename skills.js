const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get user skills
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('skills');
    res.json({
      skills: user.skills
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching skills' 
    });
  }
});

// Add or update skills
router.post('/', async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ 
        error: 'Skills must be an array' 
      });
    }

    // Validate skill structure
    for (const skill of skills) {
      if (!skill.name || !skill.level) {
        return res.status(400).json({ 
          error: 'Each skill must have name and level' 
        });
      }
      
      if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.level)) {
        return res.status(400).json({ 
          error: 'Invalid skill level' 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { skills },
      { new: true, runValidators: true }
    ).select('skills');

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills
    });

  } catch (error) {
    console.error('Update skills error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error while updating skills' 
    });
  }
});

// Add single skill
router.post('/add', async (req, res) => {
  try {
    const { name, level, category, yearsOfExperience } = req.body;

    if (!name || !level) {
      return res.status(400).json({ 
        error: 'Skill name and level are required' 
      });
    }

    if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(level)) {
      return res.status(400).json({ 
        error: 'Invalid skill level' 
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if skill already exists
    const existingSkillIndex = user.skills.findIndex(
      skill => skill.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSkillIndex !== -1) {
      // Update existing skill
      user.skills[existingSkillIndex] = {
        name,
        level,
        category: category || 'Programming',
        yearsOfExperience: yearsOfExperience || 0
      };
    } else {
      // Add new skill
      user.skills.push({
        name,
        level,
        category: category || 'Programming',
        yearsOfExperience: yearsOfExperience || 0
      });
    }

    await user.save();

    res.json({
      message: existingSkillIndex !== -1 ? 'Skill updated successfully' : 'Skill added successfully',
      skills: user.skills
    });

  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ 
      error: 'Internal server error while adding skill' 
    });
  }
});

// Update single skill
router.put('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { name, level, category, yearsOfExperience } = req.body;

    const user = await User.findById(req.user._id);
    
    const skillIndex = user.skills.findIndex(
      skill => skill._id.toString() === skillId
    );

    if (skillIndex === -1) {
      return res.status(404).json({ 
        error: 'Skill not found' 
      });
    }

    // Update skill
    if (name) user.skills[skillIndex].name = name;
    if (level) {
      if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(level)) {
        return res.status(400).json({ 
          error: 'Invalid skill level' 
        });
      }
      user.skills[skillIndex].level = level;
    }
    if (category) user.skills[skillIndex].category = category;
    if (yearsOfExperience !== undefined) user.skills[skillIndex].yearsOfExperience = yearsOfExperience;

    await user.save();

    res.json({
      message: 'Skill updated successfully',
      skill: user.skills[skillIndex]
    });

  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating skill' 
    });
  }
});

// Delete skill
router.delete('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;

    const user = await User.findById(req.user._id);
    
    const skillIndex = user.skills.findIndex(
      skill => skill._id.toString() === skillId
    );

    if (skillIndex === -1) {
      return res.status(404).json({ 
        error: 'Skill not found' 
      });
    }

    user.skills.splice(skillIndex, 1);
    await user.save();

    res.json({
      message: 'Skill deleted successfully',
      skills: user.skills
    });

  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting skill' 
    });
  }
});

// Get skill statistics
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('skills');
    
    const stats = {
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
      // Count by level
      stats.byLevel[skill.level]++;
      
      // Count by category
      if (!stats.byCategory[skill.category]) {
        stats.byCategory[skill.category] = 0;
      }
      stats.byCategory[skill.category]++;
      
      // Calculate total experience
      totalExperience += skill.yearsOfExperience || 0;
    });

    stats.averageExperience = user.skills.length > 0 ? 
      Math.round((totalExperience / user.skills.length) * 10) / 10 : 0;

    res.json({
      stats
    });

  } catch (error) {
    console.error('Get skill stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching skill statistics' 
    });
  }
});

// Get skills by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const user = await User.findById(req.user._id).select('skills');
    
    const skillsInCategory = user.skills.filter(
      skill => skill.category === category
    );

    res.json({
      category,
      skills: skillsInCategory,
      count: skillsInCategory.length
    });

  } catch (error) {
    console.error('Get skills by category error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching skills by category' 
    });
  }
});

// Search skills
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const user = await User.findById(req.user._id).select('skills');
    
    const matchingSkills = user.skills.filter(skill =>
      skill.name.toLowerCase().includes(query.toLowerCase()) ||
      skill.category.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      query,
      skills: matchingSkills,
      count: matchingSkills.length
    });

  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({ 
      error: 'Internal server error while searching skills' 
    });
  }
});

module.exports = router; 