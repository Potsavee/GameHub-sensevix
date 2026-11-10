import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import Home from './pages/Home';
import Games from './pages/Games';
import GameDetail from './pages/GameDetail';
import ApiLab from './pages/ApiLab';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import GameWishlist from './pages/GameWishlist';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminMembers from './pages/admin/AdminMembers';
import Profile from './pages/Profile';

function App() {
  return (
    // AuthProvider ครอบทั้งแอป ทุกหน้าข้างในจึงเรียก useAuth() ได้
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/me/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/me/wishlist" element={<ProtectedRoute><GameWishlist /></ProtectedRoute>} />
            {/* หลังบ้าน: ครอบทั้งกิ่งด้วย RequireRole ครั้งเดียว หน้าลูกทุกหน้าได้รับการป้องกันหมด */}
            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminMembers />} />
              <Route path="members" element={<AdminMembers />} />
            </Route>
            <Route path="/lab" element={<ApiLab />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
