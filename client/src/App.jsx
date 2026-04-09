import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TurkuSearch from './pages/TurkuSearch';
import AnalysisForm from './pages/AnalysisForm';
import MyAnalyses from './pages/MyAnalyses';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Yükleniyor...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><TurkuSearch /></PrivateRoute>} />
          <Route path="/analysis/new/:turkuId" element={<PrivateRoute><AnalysisForm /></PrivateRoute>} />
          <Route path="/analysis/:id" element={<PrivateRoute><AnalysisForm /></PrivateRoute>} />
          <Route path="/my-analyses" element={<PrivateRoute><MyAnalyses /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}
