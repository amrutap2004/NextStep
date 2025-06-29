const mongoose = require('mongoose');

const roadmapStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true,
    enum: ['1-2 weeks', '1 month', '2-3 months', '3-6 months', '6+ months']
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  tools: [{
    name: String,
    description: String,
    link: String
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['Course', 'Documentation', 'Video', 'Book', 'Article', 'Project']
    },
    url: String,
    description: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    }
  }],
  skillsToLearn: [String],
  prerequisites: [String],
  order: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: [{
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  careerPath: {
    type: String,
    required: true,
    trim: true
  },
  targetRole: {
    type: String,
    required: true,
    trim: true
  },
  estimatedDuration: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  steps: [roadmapStepSchema],
  currentStep: {
    type: Number,
    default: 0
  },
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active'
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  customizations: {
    modifiedSteps: [Number],
    addedSteps: [roadmapStepSchema],
    removedSteps: [Number]
  },
  completionDate: Date,
  startedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
roadmapSchema.index({ user: 1, status: 1 });
roadmapSchema.index({ careerPath: 1 });
roadmapSchema.index({ isPublic: 1, likes: 1 });
roadmapSchema.index({ tags: 1 });

// Method to calculate overall progress
roadmapSchema.methods.calculateProgress = function() {
  if (this.steps.length === 0) return 0;
  
  const completedSteps = this.steps.filter(step => step.isCompleted).length;
  const totalSteps = this.steps.length;
  
  this.overallProgress = Math.round((completedSteps / totalSteps) * 100);
  return this.overallProgress;
};

// Method to get next step
roadmapSchema.methods.getNextStep = function() {
  return this.steps.find(step => !step.isCompleted);
};

// Method to mark step as completed
roadmapSchema.methods.completeStep = function(stepIndex) {
  if (stepIndex >= 0 && stepIndex < this.steps.length) {
    this.steps[stepIndex].isCompleted = true;
    this.steps[stepIndex].completedAt = new Date();
    this.steps[stepIndex].progress = 100;
    this.calculateProgress();
    
    // Update current step
    this.currentStep = Math.min(stepIndex + 1, this.steps.length - 1);
    
    // Check if roadmap is completed
    if (this.overallProgress === 100) {
      this.status = 'completed';
      this.completionDate = new Date();
    }
  }
};

// Method to add note to step
roadmapSchema.methods.addNoteToStep = function(stepIndex, noteContent) {
  if (stepIndex >= 0 && stepIndex < this.steps.length) {
    this.steps[stepIndex].notes.push({
      content: noteContent,
      createdAt: new Date()
    });
  }
};

// Virtual for step count
roadmapSchema.virtual('totalSteps').get(function() {
  return this.steps.length;
});

roadmapSchema.virtual('completedSteps').get(function() {
  return this.steps.filter(step => step.isCompleted).length;
});

// Ensure virtual fields are serialized
roadmapSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Roadmap', roadmapSchema); 