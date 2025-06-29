const OpenAI = require('openai');

// Initialize OpenAI with fallback for missing API key
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
  });
} catch (error) {
  console.warn('OpenAI API key not found. AI features will be limited.');
  openai = null;
}

class AIService {
  constructor() {
    this.model = 'gpt-4';
    this.maxTokens = 2000;
  }

  // Generate career roadmap
  async generateRoadmap(userProfile, targetRole, timeFrame) {
    try {
      if (!openai) {
        // Fallback response when OpenAI is not available
        return this.getFallbackRoadmap(userProfile, targetRole, timeFrame);
      }

      const prompt = this.buildRoadmapPrompt(userProfile, targetRole, timeFrame);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert career coach and technical mentor. Generate detailed, actionable career roadmaps that help users achieve their career goals. Always provide specific, practical steps with realistic timelines and resources.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      const roadmapData = this.parseRoadmapResponse(response.choices[0].message.content);
      return roadmapData;

    } catch (error) {
      console.error('AI Roadmap generation error:', error);
      // Return fallback roadmap on error
      return this.getFallbackRoadmap(userProfile, targetRole, timeFrame);
    }
  }

  // AI Mentor Chat
  async chatWithMentor(userProfile, message, conversationHistory = []) {
    try {
      if (!openai) {
        // Fallback response when OpenAI is not available
        return {
          response: this.getFallbackChatResponse(message),
          tokens: 0
        };
      }

      const prompt = this.buildChatPrompt(userProfile, message, conversationHistory);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an experienced career mentor and technical advisor. Provide personalized, actionable advice based on the user's background, skills, and career goals. Be encouraging, practical, and specific in your recommendations.`
          },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.8
      });

      return {
        response: response.choices[0].message.content,
        tokens: response.usage.total_tokens
      };

    } catch (error) {
      console.error('AI Chat error:', error);
      return {
        response: this.getFallbackChatResponse(message),
        tokens: 0
      };
    }
  }

  // Build roadmap generation prompt
  buildRoadmapPrompt(userProfile, targetRole, timeFrame) {
    const { skills, experienceLevel, interests, careerGoals, currentRole } = userProfile;
    
    return `
Generate a detailed career roadmap to help this user transition from their current role to ${targetRole} within ${timeFrame}.

User Profile:
- Current Role: ${currentRole || 'Not specified'}
- Experience Level: ${experienceLevel}
- Current Skills: ${skills.map(s => `${s.name} (${s.level})`).join(', ')}
- Interests: ${interests.join(', ')}
- Career Goals: ${careerGoals.join(', ')}

Please provide a JSON response with the following structure:
{
  "title": "Roadmap title",
  "description": "Brief description of the roadmap",
  "careerPath": "Career path name",
  "targetRole": "${targetRole}",
  "estimatedDuration": "${timeFrame}",
  "difficulty": "Beginner/Intermediate/Advanced",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed description",
      "duration": "1-2 weeks/1 month/2-3 months/3-6 months/6+ months",
      "difficulty": "Beginner/Intermediate/Advanced",
      "tools": [
        {
          "name": "Tool name",
          "description": "Tool description",
          "link": "Tool URL"
        }
      ],
      "resources": [
        {
          "title": "Resource title",
          "type": "Course/Documentation/Video/Book/Article/Project",
          "url": "Resource URL",
          "description": "Resource description"
        }
      ],
      "skillsToLearn": ["skill1", "skill2"],
      "prerequisites": ["prerequisite1", "prerequisite2"],
      "order": 1
    }
  ],
  "tags": ["tag1", "tag2"]
}

Make sure the roadmap is realistic, actionable, and tailored to the user's current skill level and time constraints.`;
  }

  // Build chat prompt
  buildChatPrompt(userProfile, message, conversationHistory) {
    const { skills, experienceLevel, interests, careerGoals, currentRole } = userProfile;
    
    return `
As a career mentor, provide personalized advice to this user.

User Background:
- Current Role: ${currentRole || 'Not specified'}
- Experience Level: ${experienceLevel}
- Skills: ${skills.map(s => `${s.name} (${s.level})`).join(', ')}
- Interests: ${interests.join(', ')}
- Career Goals: ${careerGoals.join(', ')}

User Question: ${message}

Please provide:
1. Direct answer to their question
2. Specific actionable steps
3. Relevant resources or tools
4. Encouragement and motivation

Keep your response conversational, practical, and tailored to their experience level.`;
  }

  // Parse roadmap response from AI
  parseRoadmapResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const roadmapData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!roadmapData.title || !roadmapData.steps || !Array.isArray(roadmapData.steps)) {
        throw new Error('Invalid roadmap structure');
      }

      // Add order to steps if missing
      roadmapData.steps = roadmapData.steps.map((step, index) => ({
        ...step,
        order: step.order || index + 1,
        isCompleted: false,
        progress: 0
      }));

      return roadmapData;

    } catch (error) {
      console.error('Roadmap parsing error:', error);
      throw new Error('Failed to parse roadmap response');
    }
  }

  // Generate skill recommendations
  async recommendSkills(userProfile, targetRole) {
    try {
      if (!openai) {
        // Fallback response when OpenAI is not available
        return this.getFallbackSkillRecommendations(userProfile, targetRole);
      }

      const prompt = `
Based on this user's profile, recommend specific skills they should learn to become a ${targetRole}.

User Profile:
- Current Skills: ${userProfile.skills.map(s => `${s.name} (${s.level})`).join(', ')}
- Experience Level: ${userProfile.experienceLevel}
- Interests: ${userProfile.interests.join(', ')}

Provide a JSON response with:
{
  "recommendedSkills": [
    {
      "name": "Skill name",
      "priority": "High/Medium/Low",
      "reason": "Why this skill is important",
      "estimatedTime": "Time to learn",
      "resources": ["resource1", "resource2"]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a technical skills advisor. Provide specific, actionable skill recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Skill recommendation error:', error);
      return this.getFallbackSkillRecommendations(userProfile, targetRole);
    }
  }

  // Analyze learning progress
  async analyzeProgress(userProfile, completedSteps, currentStep) {
    try {
      if (!openai) {
        // Fallback response when OpenAI is not available
        return this.getFallbackProgressAnalysis(userProfile, completedSteps, currentStep);
      }

      const prompt = `
Analyze this user's learning progress and provide insights.

User Profile:
- Experience Level: ${userProfile.experienceLevel}
- Completed Steps: ${completedSteps.length}
- Current Step: ${currentStep?.title || 'None'}

Provide a JSON response with:
{
  "progress": {
    "percentage": 0-100,
    "status": "On track/Behind/Ahead",
    "estimatedCompletion": "Estimated completion date"
  },
  "insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a learning progress analyst. Provide insights and recommendations based on user progress.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.6
      });

      const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Progress analysis error:', error);
      return this.getFallbackProgressAnalysis(userProfile, completedSteps, currentStep);
    }
  }

  // Fallback methods when OpenAI is not available
  getFallbackRoadmap(userProfile, targetRole, timeFrame) {
    return {
      title: `Career Path to ${targetRole}`,
      description: `A structured roadmap to help you transition to ${targetRole} within ${timeFrame}`,
      careerPath: targetRole,
      targetRole: targetRole,
      estimatedDuration: timeFrame,
      difficulty: "Intermediate",
      steps: [
        {
          title: "Assess Current Skills",
          description: "Evaluate your current technical and soft skills to identify gaps",
          duration: "1-2 weeks",
          difficulty: "Beginner",
          tools: [
            {
              name: "Skills Assessment",
              description: "Self-assessment tool",
              link: "#"
            }
          ],
          resources: [
            {
              title: "Skills Gap Analysis Guide",
              type: "Article",
              url: "#",
              description: "How to identify skill gaps"
            }
          ],
          skillsToLearn: ["Self-assessment"],
          prerequisites: [],
          order: 1,
          isCompleted: false,
          progress: 0
        },
        {
          title: "Learn Core Technologies",
          description: "Master the fundamental technologies required for this role",
          duration: "2-3 months",
          difficulty: "Intermediate",
          tools: [
            {
              name: "Learning Platform",
              description: "Online courses and tutorials",
              link: "#"
            }
          ],
          resources: [
            {
              title: "Core Technology Course",
              type: "Course",
              url: "#",
              description: "Comprehensive course on core technologies"
            }
          ],
          skillsToLearn: ["Core technologies"],
          prerequisites: ["Self-assessment"],
          order: 2,
          isCompleted: false,
          progress: 0
        },
        {
          title: "Build Projects",
          description: "Create portfolio projects to demonstrate your skills",
          duration: "1-2 months",
          difficulty: "Intermediate",
          tools: [
            {
              name: "GitHub",
              description: "Code repository",
              link: "https://github.com"
            }
          ],
          resources: [
            {
              title: "Project Ideas",
              type: "Article",
              url: "#",
              description: "Project ideas for portfolio"
            }
          ],
          skillsToLearn: ["Project management", "Version control"],
          prerequisites: ["Core technologies"],
          order: 3,
          isCompleted: false,
          progress: 0
        }
      ],
      tags: [targetRole, "career-transition", timeFrame]
    };
  }

  getFallbackChatResponse(message) {
    const responses = [
      "That's a great question! I'd recommend starting with the fundamentals and building up from there. Consider taking some online courses to strengthen your foundation.",
      "Based on your question, I suggest focusing on practical projects. Hands-on experience is often the best way to learn and demonstrate your skills.",
      "Great question! Networking and building a strong portfolio are key. Consider joining relevant communities and working on open-source projects.",
      "I'd recommend setting clear, achievable goals and tracking your progress. Break down your learning into smaller, manageable steps.",
      "That's an excellent point! Continuous learning and staying updated with industry trends is crucial in tech. Consider following industry leaders and participating in conferences."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getFallbackProgressAnalysis(userProfile, completedSteps, currentStep) {
    const progressPercentage = completedSteps.length > 0 ? Math.min((completedSteps.length / 3) * 100, 100) : 0;
    
    return {
      progress: {
        percentage: progressPercentage,
        status: progressPercentage >= 70 ? "Ahead" : progressPercentage >= 40 ? "On track" : "Behind",
        estimatedCompletion: "3-6 months"
      },
      insights: [
        "You're making steady progress in your learning journey",
        "Focus on completing the current step before moving forward"
      ],
      recommendations: [
        "Set aside dedicated time each day for learning",
        "Practice regularly to reinforce your skills",
        "Connect with others in the field for support and guidance"
      ]
    };
  }

  getFallbackSkillRecommendations(userProfile, targetRole) {
    const commonSkills = {
      "Frontend Developer": [
        {
          name: "JavaScript",
          priority: "High",
          reason: "Core language for web development",
          estimatedTime: "2-3 months",
          resources: ["MDN Web Docs", "JavaScript.info", "Eloquent JavaScript"]
        },
        {
          name: "React.js",
          priority: "High",
          reason: "Popular frontend framework",
          estimatedTime: "1-2 months",
          resources: ["React Documentation", "React Tutorial", "Create React App"]
        },
        {
          name: "HTML/CSS",
          priority: "Medium",
          reason: "Foundation of web development",
          estimatedTime: "1 month",
          resources: ["MDN HTML", "CSS-Tricks", "Flexbox Froggy"]
        }
      ],
      "Backend Developer": [
        {
          name: "Node.js",
          priority: "High",
          reason: "JavaScript runtime for server-side development",
          estimatedTime: "2-3 months",
          resources: ["Node.js Documentation", "Express.js Guide", "Node.js Tutorial"]
        },
        {
          name: "Database Design",
          priority: "High",
          reason: "Essential for data management",
          estimatedTime: "1-2 months",
          resources: ["MongoDB University", "SQL Tutorial", "Database Design Course"]
        },
        {
          name: "API Development",
          priority: "Medium",
          reason: "Building RESTful APIs",
          estimatedTime: "1 month",
          resources: ["REST API Tutorial", "Postman Learning", "API Design Guide"]
        }
      ],
      "Full Stack Developer": [
        {
          name: "JavaScript",
          priority: "High",
          reason: "Used for both frontend and backend",
          estimatedTime: "3-4 months",
          resources: ["MDN Web Docs", "JavaScript.info", "Node.js Documentation"]
        },
        {
          name: "React.js",
          priority: "High",
          reason: "Popular frontend framework",
          estimatedTime: "1-2 months",
          resources: ["React Documentation", "React Tutorial", "Create React App"]
        },
        {
          name: "Node.js & Express",
          priority: "High",
          reason: "Backend development with JavaScript",
          estimatedTime: "2-3 months",
          resources: ["Node.js Documentation", "Express.js Guide", "MERN Stack Tutorial"]
        }
      ]
    };

    return {
      recommendedSkills: commonSkills[targetRole] || [
        {
          name: "Problem Solving",
          priority: "High",
          reason: "Fundamental skill for any technical role",
          estimatedTime: "Ongoing",
          resources: ["LeetCode", "HackerRank", "CodeWars"]
        },
        {
          name: "Version Control",
          priority: "Medium",
          reason: "Essential for collaborative development",
          estimatedTime: "1-2 weeks",
          resources: ["Git Documentation", "GitHub Tutorial", "Git Cheat Sheet"]
        }
      ]
    };
  }
}

module.exports = new AIService(); 