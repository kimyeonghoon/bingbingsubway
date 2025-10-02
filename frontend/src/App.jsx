import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Trophy, Award, BarChart3, User, LogIn, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ChallengePage from './pages/ChallengePage';
import StatsDashboard from './components/StatsDashboard';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-to-main">
        메인 콘텐츠로 건너뛰기
      </a>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200" role="navigation" aria-label="메인 네비게이션">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 hover:text-blue-600 transition-colors">
              <span className="text-2xl sm:text-3xl">🚇</span>
              <span className="hidden xs:inline">빙빙 지하철</span>
              <span className="xs:hidden">빙빙</span>
            </Link>
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {isAuthenticated ? (
                <>
                  <NavLink to="/" icon={<Home className="w-5 h-5" />} label="홈" />
                  <NavLink to="/stats" icon={<BarChart3 className="w-5 h-5" />} label="통계" />
                  <NavLink to="/achievements" icon={<Award className="w-5 h-5" />} label="업적" />
                  <NavLink to="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="랭킹" />
                  <NavLink to="/profile" icon={<User className="w-5 h-5" />} label="프로필" />
                  <button
                    onClick={handleLogout}
                    aria-label="로그아웃"
                    className="flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600
                               hover:bg-red-50 hover:text-red-600 transition-all duration-200
                               focus:ring-2 focus:ring-red-500 focus:outline-none min-w-[44px] min-h-[44px]"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" icon={<LogIn className="w-5 h-5" />} label="로그인" />
                  <NavLink to="/register" icon={<User className="w-5 h-5" />} label="회원가입" />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <main id="main-content" role="main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><HomePageWrapper /></ProtectedRoute>} />
          <Route path="/challenge" element={<ProtectedRoute><ChallengePageWrapper /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><StatsDashboardWrapper /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><AchievementsPageWrapper /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPageWrapper /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePageWrapper /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-600
                 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200
                 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[44px] min-h-[44px]"
    >
      {icon}
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </Link>
  );
}

// Page Wrappers - userId를 user.id로 전달
function HomePageWrapper() {
  const { user } = useAuth();
  return <HomePage userId={user?.id} />;
}

function ChallengePageWrapper() {
  const { user } = useAuth();
  return <ChallengePage userId={user?.id} />;
}

function StatsDashboardWrapper() {
  const { user } = useAuth();
  return <StatsDashboard userId={user?.id} />;
}

function AchievementsPageWrapper() {
  const { user } = useAuth();
  return <AchievementsPage userId={user?.id} />;
}

function LeaderboardPageWrapper() {
  const { user } = useAuth();
  return <LeaderboardPage userId={user?.id} />;
}

function ProfilePageWrapper() {
  const { user } = useAuth();
  return <ProfilePage userId={user?.id} />;
}

export default App;
