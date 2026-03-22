import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { Toaster } from 'sonner';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { GalleryPage } from '@/pages/public/GalleryPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { UpcommingEvents } from '@/pages/public/UpcommingEvents';

// Member/Admin Pages
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
import { EngagementPage } from '@/pages/admin/EngagementPage';
import { MusicFolderPage } from '@/pages/secured/music-folder/MusicFolderPage';
import { ToolkitPage } from '@/pages/secured/toolkit/ToolkitPage';
import { TheoryPage } from '@/pages/secured/theory/TheoryPage';
import { GrifftabellePage } from '@/pages/secured/grifftabelle/GrifftabellePage';
import { WorkspacePage } from '@/pages/admin/WorkspacePage';
import { CmsManagementPage } from '@/pages/admin/CmsManagementPage';
import { DatabasePreviewerPage } from '@/pages/admin/DatabasePreviewerPage';
import { TableDetailPage } from '@/pages/admin/TableDetailPage';
import { ProtokollPage } from '@/pages/admin/ProtokollPage';
import { LogsPage } from '@/pages/admin/LogsPage';
import { GrifftabelleEditorPage } from '@/pages/admin/GrifftabelleEditorPage';
import { ChatPortalPage } from '@/pages/chat/ChatPortalPage';
import { ChatDetailPage } from '@/pages/chat/ChatDetailPage';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => { });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/events" element={<UpcommingEvents />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            <Route path="/member" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<EventListPage />} />
              <Route path="events" element={<EventListPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="files" element={<FileListPage />} />
              <Route path="music-folders" element={<MusicFolderPage />} />
              <Route path="music-folders/:id" element={<MusicFolderPage />} />
              <Route path="settings" element={<UserSettingsPage />} />
              <Route path="members" element={<UserManagementPage />} />
              <Route path="chat" element={<ChatPortalPage />} />
              <Route path="chat/:chatId" element={<ChatDetailPage />} />

              <Route path="grifftabelle" element={<ProtectedRoute requireAdmin><GrifftabellePage /></ProtectedRoute>} />
              <Route path="admin/toolkit" element={<ProtectedRoute requireAdmin><ToolkitPage /></ProtectedRoute>} />
              <Route path="admin/theory" element={<ProtectedRoute requireAdmin><TheoryPage /></ProtectedRoute>} />
              <Route path="admin/events/new" element={<ProtectedRoute requireAdmin><CreateEventPage /></ProtectedRoute>} />
              <Route path="admin/events/:id/edit" element={<ProtectedRoute requireAdmin><CreateEventPage /></ProtectedRoute>} />
              <Route path="admin/registers" element={<ProtectedRoute requireAdmin><RegisterManagementPage /></ProtectedRoute>} />
              <Route path="admin/news" element={<ProtectedRoute requireAdmin><NewsManagementPage /></ProtectedRoute>} />
              <Route path="admin/events" element={<ProtectedRoute requireAdmin><EventManagementPage /></ProtectedRoute>} />
              <Route path="admin/sheet-music" element={<ProtectedRoute requireAdmin><SheetMusicManagementPage /></ProtectedRoute>} />
              <Route path="admin/statistics" element={<ProtectedRoute requireAdmin><StatisticsPage /></ProtectedRoute>} />
              <Route path="admin/engagement" element={<ProtectedRoute requireAdmin><EngagementPage /></ProtectedRoute>} />
              <Route path="admin/workspace" element={<ProtectedRoute requireAdmin><WorkspacePage /></ProtectedRoute>} />
              <Route path="admin/cms" element={<ProtectedRoute requireAdmin><CmsManagementPage /></ProtectedRoute>} />
              <Route path="admin/db" element={<ProtectedRoute requireAdmin><DatabasePreviewerPage /></ProtectedRoute>} />
              <Route path="admin/db/tables/:tableName" element={<ProtectedRoute requireAdmin><TableDetailPage /></ProtectedRoute>} />
              <Route path="admin/protokoll" element={<ProtectedRoute requireAdmin><ProtokollPage /></ProtectedRoute>} />
              <Route path="admin/logs" element={<ProtectedRoute requireAdmin><LogsPage /></ProtectedRoute>} />
              <Route path="admin/grifftabelle-edit" element={<ProtectedRoute requireAdmin><GrifftabelleEditorPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
