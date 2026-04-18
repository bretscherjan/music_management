import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const isAppMode = Capacitor.isNativePlatform() || import.meta.env.VITE_APP_MODE === 'app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalSearchProvider } from '@/context/GlobalSearchContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { Toaster } from 'sonner';

// Public Pages
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { AppDownloadPage } from '@/pages/public/AppDownloadPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { GalleryPage } from '@/pages/public/GalleryPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { UpcommingEvents } from '@/pages/public/UpcommingEvents';

// Member/Admin Pages
import { EventListPage } from '@/pages/events/EventListPage';
import { EventArchivePage } from '@/pages/events/EventArchivePage';
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
import PollsPage from '@/pages/polls/PollsPage';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Skip service-worker in native app mode (Capacitor handles it)
    if (!isAppMode && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => { });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <GlobalSearchProvider>
          <Routes>
            {/* ── Public website routes (skipped in app mode) ── */}
            {!isAppMode && (
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/events" element={<UpcommingEvents />} />
              </Route>
            )}

            {/* In app mode "/" immediately redirects to the protected area */}
            {isAppMode && <Route path="/" element={<Navigate to="/member" replace />} />}
            {isAppMode && <Route path="/member/download" element={<Navigate to="/member" replace/>} />}

            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            <Route path="/member" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<EventListPage />} />
              {!isAppMode && <Route path="download" element={<AppDownloadPage />} />}
              <Route path="events" element={<ProtectedRoute permission="events:read"><EventListPage /></ProtectedRoute>} />
              <Route path="events/archiv" element={<ProtectedRoute permission="events:read"><EventArchivePage /></ProtectedRoute>} />
              <Route path="events/:id" element={<ProtectedRoute permission="events:read"><EventDetailPage /></ProtectedRoute>} />
              <Route path="files" element={<ProtectedRoute permission="files:read"><FileListPage /></ProtectedRoute>} />
              <Route path="music-folders" element={<ProtectedRoute permission="folders:read"><MusicFolderPage /></ProtectedRoute>} />
              <Route path="music-folders/:id" element={<ProtectedRoute permission="folders:read"><MusicFolderPage /></ProtectedRoute>} />
              <Route path="settings" element={<UserSettingsPage />} />
              <Route path="members" element={<ProtectedRoute permission="members:read"><UserManagementPage /></ProtectedRoute>} />
              <Route path="chat" element={<ProtectedRoute permission="chat:read"><ChatPortalPage /></ProtectedRoute>} />
              <Route path="chat/:chatId" element={<ProtectedRoute permission="chat:read"><ChatDetailPage /></ProtectedRoute>} />
              <Route path="polls" element={<ProtectedRoute permission="polls:read"><PollsPage /></ProtectedRoute>} />

              <Route path="grifftabelle" element={<ProtectedRoute permission="grifftabelle:read"><GrifftabellePage /></ProtectedRoute>} />
              <Route path="admin/toolkit" element={<ProtectedRoute permission="toolkit:read"><ToolkitPage /></ProtectedRoute>} />
              <Route path="admin/theory" element={<ProtectedRoute permission="theory:read"><TheoryPage /></ProtectedRoute>} />
              <Route path="admin/events/new" element={<ProtectedRoute permission="events:write"><CreateEventPage /></ProtectedRoute>} />
              <Route path="admin/events/:id/edit" element={<ProtectedRoute permission="events:write"><CreateEventPage /></ProtectedRoute>} />
              <Route path="admin/registers" element={<ProtectedRoute permission="registers:write"><RegisterManagementPage /></ProtectedRoute>} />
              <Route path="admin/news" element={<ProtectedRoute permission="news:write"><NewsManagementPage /></ProtectedRoute>} />
              <Route path="admin/events" element={<ProtectedRoute permission="events:write"><EventManagementPage /></ProtectedRoute>} />
              <Route path="admin/sheet-music" element={<ProtectedRoute permission="sheetMusic:read"><SheetMusicManagementPage /></ProtectedRoute>} />
              <Route path="admin/statistics" element={<ProtectedRoute permission="statistics:read"><StatisticsPage /></ProtectedRoute>} />
              <Route path="admin/engagement" element={<ProtectedRoute permission="engagement:read"><EngagementPage /></ProtectedRoute>} />
              <Route path="admin/workspace" element={<ProtectedRoute permission="workspace:read"><WorkspacePage /></ProtectedRoute>} />
              <Route path="admin/cms" element={<ProtectedRoute permission="cms:write"><CmsManagementPage /></ProtectedRoute>} />
              <Route path="admin/db" element={<ProtectedRoute permission="db:read"><DatabasePreviewerPage /></ProtectedRoute>} />
              <Route path="admin/db/tables/:tableName" element={<ProtectedRoute permission="db:read"><TableDetailPage /></ProtectedRoute>} />
              <Route path="admin/protokoll" element={<ProtectedRoute permission="protokoll:read"><ProtokollPage /></ProtectedRoute>} />
              <Route path="admin/logs" element={<ProtectedRoute permission="db:read"><LogsPage /></ProtectedRoute>} />
              <Route path="admin/grifftabelle-edit" element={<ProtectedRoute permission="grifftabelle:write"><GrifftabelleEditorPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </GlobalSearchProvider>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
