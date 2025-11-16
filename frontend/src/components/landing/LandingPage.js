import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, PieChart, Wallet, Tag, FileText, Zap, Feather, Wind, ArrowRight, Play, X } from 'lucide-react';

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
      description: "Manage multiple bank accounts, credit cards, and cash with real-time balance tracking"
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

  const highlights = [
    {
      icon: <Feather className="w-6 h-6" />,
      title: "Lightweight",
      description: "Fast loading, minimal resources, optimized performance"
    },
    {
      icon: <Wind className="w-6 h-6" />,
      title: "Flexible",
      description: "Adapts to your workflow, customizable categories and tags"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant",
      description: "Real-time updates, no delays, responsive interface"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/20 via-transparent to-gray-100/20 pointer-events-none"></div>
      
      {/* Hero Section */}
      <div className="relative">
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="relative group">
                {/* Glassmorphism container */}
                <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 transform group-hover:scale-105 transition-all duration-300">
                  <DollarSign className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-900" />
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gray-300/20 rounded-2xl sm:rounded-3xl blur-xl -z-10 group-hover:bg-gray-400/30 transition-all duration-300"></div>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 text-gray-900" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
              Finance Tracker
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-2 sm:mb-3 max-w-2xl mx-auto font-light">
              Lightweight. Flexible. Instant.
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-8 sm:mb-12 max-w-3xl mx-auto">
              A minimalist approach to personal finance management—fast, adaptable, and built for your workflow
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10 sm:mb-14">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-gray-900 mb-3 flex justify-center">
                    {highlight.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{highlight.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{highlight.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
                className="group w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/auth', { state: { mode: 'login' } })}
                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-white/70 backdrop-blur-xl text-gray-900 rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-white border border-gray-300 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Login
              </button>

              <button
                onClick={() => setShowVideo(true)}
                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-white/50 backdrop-blur-xl text-gray-900 rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-white/70 border border-gray-200 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Everything You Need
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, powerful tools for complete financial control
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-200/50 hover:border-gray-300/80 transform hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="text-gray-900 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Section */}
      <div className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-gray-200/50 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Finance Tracker?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-center text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Built with a focus on performance, simplicity, and user experience
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gray-50/50 border border-gray-200/30">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Minimal Learning Curve</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Intuitive interface designed for immediate productivity</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gray-50/50 border border-gray-200/30">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">No Bloat</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Only essential features, nothing unnecessary</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gray-50/50 border border-gray-200/30">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Fully Responsive</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Works seamlessly on mobile, tablet, and desktop</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gray-50/50 border border-gray-200/30">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Privacy First</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Your data stays secure with session-based authentication</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative py-16 sm:py-20 md:py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start Tracking Today
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Free forever. No credit card required. Start managing your finances in seconds.
          </p>
          <button
            onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            className="group px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-gray-900 text-white rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-gray-800 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-6 sm:py-8 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          © 2024 Finance Tracker. Lightweight financial management for everyone.
        </p>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-3 -right-3 bg-gray-900 hover:bg-gray-800 text-white p-2 rounded-full shadow-lg transition-colors z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="p-5 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-900">Finance Tracker Demo</h3>
              
              {/* Video Placeholder - Replace with actual video */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl aspect-video flex items-center justify-center border border-gray-300">
                <div className="text-center p-6 sm:p-8">
                  <Play className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-900 mx-auto mb-4 sm:mb-6" />
                  <p className="text-base sm:text-lg md:text-xl text-gray-900 font-semibold mb-2 sm:mb-3">Demo Video Coming Soon!</p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4">
                    See how Finance Tracker streamlines your financial workflow
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2 text-left max-w-md mx-auto bg-white/50 rounded-lg p-4 sm:p-5 border border-gray-200">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Creating and managing transactions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Setting up categories and tags
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Managing multiple accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Setting monthly budgets
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Advanced search and filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      Uploading receipt documents
                    </li>
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

