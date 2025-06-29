import React from 'react';

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to CareerPath AI</h3>
          <p className="text-gray-600">Your AI-powered career companion is ready to help you succeed!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 