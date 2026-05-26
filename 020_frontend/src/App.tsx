import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalSearchProvider } from '@/context/GlobalSearchContext';
import { UnreadProvider } from '@/context/UnreadContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { Toaster } from 'sonner';

// Auth Pages
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

// Member Pages
import { EventListPage } from '@/pages/events/EventListPage';
import { EventArchivePage } from '@/pages/events/EventArchivePage';
import { EventDetailPage } from '@/pages/events/EventDetailPage';
import { CalendarDashboard } from '@/pages/events/CalendarDashboard';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { FileListPage } from '@/pages/files/FileListPage';
import { CreateEventPage } from '@/pages/admin/CreateEventPage';
import { RegisterManagementPage } from '@/pages/admin/RegisterManagementPage';
import { EventManagementPage } from '@/pages/admin/EventManagementPage';
import { WorkspacePage } from '@/pages/admin/WorkspacePage';
import { UserSettingsPage } from '@/pages/UserSettingsPage';
import { SheetMusicManagementPage } from '@/pages/admin/SheetMusicManagementPage';
import { ProtokollPage } from '@/pages/admin/ProtokollPage';
import { MusicFolderPage } from '@/pages/secured/music-folder/MusicFolderPage';
import { ChatPortalPage } from '@/pages/chat/ChatPortalPage';
import { ChatDetailPage } from '@/pages/chat/ChatDetailPage';
import PollsPage from '@/pages/polls/PollsPage';
import { SetlistPage } from '@/pages/setlists/SetlistPage';
import { SetlistDetailPage } from '@/pages/setlists/SetlistDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <UnreadProvider>
            <GlobalSearchProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                <Route path="/member" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<EventListPage />} />
                  <Route path="events" element={<ProtectedRoute permission="events:read"><EventListPage /></ProtectedRoute>} />
                  <Route path="events/archiv" element={<ProtectedRoute permission="events:read"><EventArchivePage /></ProtectedRoute>} />
                  <Route path="events/calendar" element={<ProtectedRoute permission="events:read"><CalendarDashboard /></ProtectedRoute>} />
                  <Route path="events/:id" element={<ProtectedRoute permission="events:read"><EventDetailPage /></ProtectedRoute>} />
                  <Route path="files" element={<ProtectedRoute permission="files:read"><FileListPage /></ProtectedRoute>} />
                  <Route path="music-folders" element={<ProtectedRoute permission="folders:read"><MusicFolderPage /></ProtectedRoute>} />
                  <Route path="music-folders/:id" element={<ProtectedRoute permission="folders:read"><MusicFolderPage /></ProtectedRoute>} />
                  <Route path="settings" element={<UserSettingsPage />} />
                  <Route path="members" element={<ProtectedRoute permission="members:read"><UserManagementPage /></ProtectedRoute>} />
                  <Route path="chat" element={<ProtectedRoute permission="chat:read"><ChatPortalPage /></ProtectedRoute>} />
                  <Route path="chat/:chatId" element={<ProtectedRoute permission="chat:read"><ChatDetailPage /></ProtectedRoute>} />
                  <Route path="polls" element={<ProtectedRoute permission="polls:read"><PollsPage /></ProtectedRoute>} />
                  <Route path="setlists" element={<ProtectedRoute permission="setlists:read"><SetlistPage /></ProtectedRoute>} />
                  <Route path="setlists/:id" element={<ProtectedRoute permission="setlists:read"><SetlistDetailPage /></ProtectedRoute>} />

                  <Route path="admin/events/new" element={<ProtectedRoute permission="events:write"><CreateEventPage /></ProtectedRoute>} />
                  <Route path="admin/events/:id/edit" element={<ProtectedRoute permission="events:write"><CreateEventPage /></ProtectedRoute>} />
                  <Route path="admin/registers" element={<ProtectedRoute permission="registers:write"><RegisterManagementPage /></ProtectedRoute>} />
                  <Route path="admin/events" element={<ProtectedRoute permission="events:write"><EventManagementPage /></ProtectedRoute>} />
                  <Route path="admin/workspace" element={<ProtectedRoute permission="workspace:read"><WorkspacePage /></ProtectedRoute>} />
                  <Route path="admin/sheet-music" element={<ProtectedRoute permission="sheetMusic:read"><SheetMusicManagementPage /></ProtectedRoute>} />
                  <Route path="admin/protokoll" element={<ProtectedRoute permission="protokoll:read"><ProtokollPage /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </GlobalSearchProvider>
          </UnreadProvider>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
