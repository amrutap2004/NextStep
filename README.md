# CareerPath AI – Smart Career Roadmap & Mentorship Platform

🚀 **Your AI-powered career companion for personalized learning paths and mentorship**

## 🧩 Key Features

### 1. 🎯 User Dashboard with Skill Tracker
- Add current skills, interests, and career goals
- Skill level tracking: Beginner, Intermediate, Advanced
- Visual skill charts (Radar and Bar charts)
- Progress tracking and achievements

### 2. 🗺️ Career Roadmap Generator
- AI-generated step-by-step career roadmaps
- Example: Web Development → Frontend → Full Stack → Cloud Engineer → DevOps
- Each step includes: Role, Duration, Tools to Learn, Resources
- Personalized learning paths based on your profile

### 3. 🤖 AI Chatbot Mentor (OpenAI Integration)
- Ask career questions like:
  - "What's next after React?"
  - "How can I become a data scientist in 1 year?"
- GPT-powered responses tailored to your profile
- Real-time career guidance and advice

### 4. 🧑‍🤝‍🧑 Peer Connect (Mentorship Board)
- Match with mentors by interests/goals
- Real-time chat via Socket.io
- Schedule mentorship calls with calendar integration
- Public "Ask Me Anything" forum
- Direct messaging system

### 5. 📚 Tech Stack Tips & Curated Resources
- Personalized learning paths
- Curated courses from YouTube, Udemy, Documentation, GitHub
- Rate and bookmark resources
- Community-driven content recommendations

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + TailwindCSS |
| State Management | Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| Authentication | JWT + bcrypt |
| AI Integration | OpenAI API (GPT-4/3.5) |
| Real-time Chat | Socket.io |
| Scheduling | React Calendar + EmailJS |

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd careerpath-ai
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend client on `http://localhost:3000`

## 📁 Project Structure

```
careerpath-ai/
├── client/                 # React frontend
│   ├── public/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Redux slices
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── index.js          # Server entry point
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Skills & Dashboard
- `GET /api/skills` - Get user skills
- `POST /api/skills` - Add/update skills
- `GET /api/dashboard` - Get dashboard data

### Career Roadmap
- `POST /api/roadmap/generate` - Generate AI roadmap
- `GET /api/roadmap/:id` - Get specific roadmap
- `PUT /api/roadmap/:id` - Update roadmap progress

### AI Mentor
- `POST /api/mentor/chat` - Chat with AI mentor
- `GET /api/mentor/history` - Get chat history

### Mentorship
- `GET /api/mentors` - Find mentors
- `POST /api/mentors/connect` - Connect with mentor
- `GET /api/mentors/messages` - Get messages

### Resources
- `GET /api/resources` - Get curated resources
- `POST /api/resources/bookmark` - Bookmark resource
- `POST /api/resources/rate` - Rate resource

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ by the CareerPath AI Team** 