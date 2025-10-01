import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Trophy, Award, BarChart3, User } from 'lucide-react';
import HomePage from './pages/HomePage';
import ChallengePage from './pages/ChallengePage';
import StatsDashboard from './components/StatsDashboard';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [userId] = useState(() => {
    const savedUserId = localStorage.getItem('bingbing_userId');
    if (savedUserId) {
      return parseInt(savedUserId);
    }
    const newUserId = Date.now();
    localStorage.setItem('bingbing_userId', newUserId.toString());
    return newUserId;
  });

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation */}
        <nav className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2 hover:scale-105 transition-transform">
                <span className="text-3xl">🚇</span>
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  빙빙 지하철
                </span>
              </Link>
              <div className="flex space-x-2">
                <NavLink to="/" icon={<Home className="w-5 h-5" />} label="홈" />
                <NavLink to="/stats" icon={<BarChart3 className="w-5 h-5" />} label="통계" />
                <NavLink to="/achievements" icon={<Award className="w-5 h-5" />} label="업적" />
                <NavLink to="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="랭킹" />
                <NavLink to="/profile" icon={<User className="w-5 h-5" />} label="프로필" />
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage userId={userId} />} />
          <Route path="/challenge" element={<ChallengePage userId={userId} />} />
          <Route path="/stats" element={<StatsDashboard userId={userId} />} />
          <Route path="/achievements" element={<AchievementsPage userId={userId} />} />
          <Route path="/leaderboard" element={<LeaderboardPage userId={userId} />} />
          <Route path="/profile" element={<ProfilePage userId={userId} />} />
        </Routes>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/80
                 hover:bg-white/20 hover:text-white transition-all duration-300
                 backdrop-blur-sm border border-transparent hover:border-white/30
                 hover:shadow-lg hover:shadow-blue-500/20"
    >
      {icon}
      <span className="hidden sm:inline text-sm font-semibold">{label}</span>
    </Link>
  );
}

export default App;
