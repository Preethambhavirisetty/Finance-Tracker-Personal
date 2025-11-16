import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, PieChart, Wallet, Tag, FileText, CheckCircle, ArrowRight, Play, X } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);

  const features = [
    {
      icon: <DollarSign className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Track Transactions",
      description: "Record income and expenses with detailed descriptions and categories"
    },
    {
      icon: <PieChart className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Category Management",
      description: "Organize finances with custom categories, icons, and colors"
    },
    {
      icon: <Tag className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Smart Tags",
      description: "Tag transactions for better organization and quick filtering"
    },
    {
      icon: <Wallet className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Multiple Accounts",
      description: "Manage multiple bank accounts, credit cards, and cash with auto-balance tracking"
    },
    {
      icon: <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Budget Tracking",
      description: "Set monthly budgets with visual alerts and spending analysis"
    },
    {
      icon: <FileText className="w-8 h-8 md:w-10 md:h-10" />,
      title: "Document Uploads",
      description: "Attach receipts and proofs to transactions (up to 3MB)"
    }
  ];

  const benefits = [
    "📊 Real-time financial insights",
    "🔒 Secure session-based authentication",
    "📱 Fully responsive (mobile, tablet, desktop)",
    "🎨 Beautiful, modern UI with dark mode support",
    "🔍 Advanced search and filtering",
    "💾 Automatic data backup"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob top-0 -left-20"></div>
          <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 top-0 -right-20"></div>
          <div className="absolute w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 bottom-0 left-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 animate-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
              Finance Tracker
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto font-light">
              Take control of your finances with intelligent tracking, budgeting, and insights
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
              <button
                onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center gap-2 sm:gap-3"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <button
                onClick={() => navigate('/auth', { state: { mode: 'login' } })}
                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-white/20 border-2 border-white/30 transform hover:scale-105 transition-all duration-300"
              >
                Login
              </button>

              <button
                onClick={() => setShowVideo(true)}
                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-red-500/20 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-red-500/30 border-2 border-red-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                Watch Demo
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-400">Free</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-300 mt-1">Always Free</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400">100%</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-300 mt-1">Secure</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-400">∞</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-300 mt-1">Unlimited</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/5 backdrop-blur-lg py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 md:mb-16" style={{ fontFamily: "'Playfair Display', serif" }}>
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="text-blue-400 mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 md:mb-16" style={{ fontFamily: "'Playfair Display', serif" }}>
            Why Choose Finance Tracker?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
                <span className="text-sm sm:text-base md:text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-lg py-12 sm:py-16 md:py-20 border-y border-white/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start Your Financial Journey Today
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
            Join thousands of users who have taken control of their finances
          </p>
          <button
            onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-400">
        <p>© 2024 Finance Tracker. Built with ❤️ for better financial management.</p>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full border-2 border-white/20">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">Finance Tracker Demo</h3>
              
              {/* Video Placeholder - Replace with actual video */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl aspect-video flex items-center justify-center border-2 border-white/10">
                <div className="text-center p-6 sm:p-8">
                  <Play className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-blue-400 mx-auto mb-4 sm:mb-6" />
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-2 sm:mb-3">Demo Video Coming Soon!</p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-400">
                    This will showcase:
                  </p>
                  <ul className="text-xs sm:text-sm md:text-base text-gray-400 mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-left max-w-md mx-auto">
                    <li>• Creating and managing transactions</li>
                    <li>• Setting up categories and tags</li>
                    <li>• Managing multiple accounts</li>
                    <li>• Setting monthly budgets</li>
                    <li>• Searching and filtering</li>
                    <li>• Uploading receipt documents</li>
                  </ul>
                  {/* 
                  To add a real video, replace this div with:
                  <video controls className="w-full rounded-lg">
                    <source src="/path-to-your-video.mp4" type="video/mp4" />
                  </video>
                  Or embed YouTube:
                  <iframe 
                    className="w-full aspect-video rounded-lg"
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                    title="Finance Tracker Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add to your CSS (in index.css or as a styled component)
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -50px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(50px, 50px) scale(1.05); }
  }
  
  .animate-blob {
    animation: blob 7s infinite;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
`;
document.head.appendChild(style);

export default LandingPage;

