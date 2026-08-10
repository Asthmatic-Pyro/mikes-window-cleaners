import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import FollowPage from "@/pages/follow/FollowPage";
import FollowLogin from "@/pages/follow/FollowLogin";
import FollowAdmin from "@/pages/follow/FollowAdmin";
import AuthCallback from "@/pages/follow/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/Follow" element={<FollowPage />} />
          <Route path="/follow" element={<FollowPage />} />
          <Route path="/Follow/login" element={<FollowLogin />} />
          <Route path="/follow/login" element={<FollowLogin />} />
          <Route path="/Follow/admin" element={<FollowAdmin />} />
          <Route path="/follow/admin" element={<FollowAdmin />} />
          <Route path="/Follow/auth/callback" element={<AuthCallback />} />
          <Route path="/follow/auth/callback" element={<AuthCallback />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
