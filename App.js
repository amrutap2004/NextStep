import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Roadmaps from './pages/Roadmaps';
import RoadmapDetail from './pages/RoadmapDetail';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Mentor from './pages/Mentor';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Redux
import { getProfile } from './features/auth/authSlice';

function App() {
  const dispatch = useDispatch();
  const { user, isLoading, profileLoaded } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);

  useEffect(() => {
    // Get user profile on app load if user exists and profile is not loaded
    if (user?.token && !profileLoaded) {
      dispatch(getProfile());
    }
  }, [dispatch, user?.token, profileLoaded]);

  useEffect(() => {
    // Apply dark mode class to body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Helmet>
        <title>CareerPath AI - Smart Career Roadmap & Mentorship Platform</title>
        <meta name="description" content="Your AI-powered career companion for personalized learning paths and mentorship" />
        <meta name="theme-color" content={isDarkMode ? "#0f172a" : "#3b82f6"} />
      </Helmet>

      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LandingPage />
                </motion.div>
              }
            />
            
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Login />
                  </motion.div>
                )
              }
            />
            
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Register />
                  </motion.div>
                )
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Dashboard />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/skills"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Skills />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/roadmaps"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Roadmaps />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/roadmaps/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <RoadmapDetail />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Resources />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/resources/:id"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <ResourceDetail />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mentor"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Mentor />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Chat />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Header />
                    <main className="pt-16">
                      <Profile />
                    </main>
                    <Footer />
                  </motion.div>
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Header />
                  <main className="pt-16">
                    <NotFound />
                  </main>
                  <Footer />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;