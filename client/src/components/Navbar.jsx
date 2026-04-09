import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="emoji">🎵</span>
          Türkü Analiz Platformu
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Ana Sayfa</Link>
          <Link to="/search" className={isActive('/search')}>Türkü Ara</Link>
          <Link to="/my-analyses" className={isActive('/my-analyses')}>Analizlerim</Link>
          <span style={{ color: 'rgba(255,255,255,0.5)', padding: '0 4px' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '0 8px' }}>
            {user?.name}
          </span>
          <button onClick={logout}>Çıkış</button>
        </div>
      </div>
    </nav>
  );
}
