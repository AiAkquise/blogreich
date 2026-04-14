import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import BlogWriter from '@/pages/BlogWriter';
import BlogEditor from '@/pages/BlogEditor';
import MyBlogs from '@/pages/MyBlogs';
import Companies from '@/pages/Companies';
import Keywords from '@/pages/Keywords';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/blog/new" element={<BlogWriter />} />
              <Route path="/blog/:id/edit" element={<BlogEditor />} />
              <Route path="/blogs" element={<MyBlogs />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/keywords" element={<Keywords />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
