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
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-2xl font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="text-3xl">🚇</span>
                <span>빙빙 지하철</span>
              </Link>
              <div className="flex space-x-1">
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
      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600
                 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
    >
      {icon}
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </Link>
  );
}

export default App;
