import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import InternalLayout from './layouts/InternalLayout';
import HomePage from './features/public/HomePage';
import NewsPage from './features/public/NewsPage';
import AgendaPage from './features/public/AgendaPage';
import AboutPage from './features/public/AboutPage';
import ContactPage from './features/public/ContactPage';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import GovernancePage from './features/governance/GovernancePage';
import InternalEventsPage from './features/events/InternalEventsPage';
import MemberDirectory from './features/members/MemberDirectory';
import FileManagement from './features/files/FileManagement';
import PollsPage from './features/polls/PollsPage';
import { useAuth } from './contexts/AuthContext';

// Simple Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes (Internal) */}
        <Route path="/internal" element={
          <ProtectedRoute>
            <InternalLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<InternalEventsPage />} />
          <Route path="members" element={<MemberDirectory />} />
          <Route path="files" element={<FileManagement />} />
          <Route path="polls" element={<PollsPage />} />
          <Route path="governance" element={<GovernancePage />} />
          <Route path="profile" element={<div>Profile Component Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
