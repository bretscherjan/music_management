import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

// Member Pages
import { Dashboard } from '@/pages/Dashboard';
import { EventListPage } from '@/pages/events/EventListPage';
import { EventDetailPage } from '@/pages/events/EventDetailPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { FileListPage } from '@/pages/files/FileListPage';
import { CreateEventPage } from '@/pages/admin/CreateEventPage';
import { RegisterManagementPage } from '@/pages/admin/RegisterManagementPage';
import { NewsManagementPage } from '@/pages/admin/NewsManagementPage';
import { EventManagementPage } from '@/pages/admin/EventManagementPage';
import { UserSettingsPage } from '@/pages/UserSettingsPage';
import { SheetMusicManagementPage } from '@/pages/admin/SheetMusicManagementPage';
import { StatisticsPage } from '@/pages/admin/StatisticsPage';
import { MusicFolderPage } from '@/pages/secured/music-folder/MusicFolderPage';
import { WorkspacePage } from '@/pages/admin/WorkspacePage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Register Service Worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => {
          // Service Worker registered
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes with PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Login and Auth Pages (public but standalone) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Protected Member Routes with MainLayout */}
            <Route
              path="/member"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="events" element={<EventListPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="files" element={<FileListPage />} />
              <Route path="music-folders" element={<MusicFolderPage />} />
              <Route path="music-folders/:id" element={<MusicFolderPage />} />
              <Route path="settings" element={<UserSettingsPage />} />
              <Route path="members" element={<UserManagementPage />} />

              {/* Admin Only Routes */}
              <Route
                path="admin/events/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/events/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/registers"
                element={
                  <ProtectedRoute requireAdmin>
                    <RegisterManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/news"
                element={
                  <ProtectedRoute requireAdmin>
                    <NewsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/events"
                element={
                  <ProtectedRoute requireAdmin>
                    <EventManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/sheet-music"
                element={
                  <ProtectedRoute requireAdmin>
                    <SheetMusicManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/statistics"
                element={
                  <ProtectedRoute requireAdmin>
                    <StatisticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/workspace"
                element={
                  <ProtectedRoute requireAdmin>
                    <WorkspacePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
