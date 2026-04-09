import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        toast.success('Kayıt başarılı!');
      } else {
        await login(email, password);
        toast.success('Giriş başarılı!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🎵 Türkü Analiz Platformu</h1>
        <p className="subtitle">Öğretim Temelli Türkü Sınıflandırma Sistemi</p>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Ad Soyad</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" required />
            </div>
          )}
          <div className="form-group">
            <label>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" required />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Lütfen bekleyin...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        <p className="toggle-link">
          {isRegister ? (
            <>Hesabınız var mı? <a onClick={() => setIsRegister(false)}>Giriş Yap</a></>
          ) : (
            <>Hesabınız yok mu? <a onClick={() => setIsRegister(true)}>Kayıt Ol</a></>
          )}
        </p>

        <div style={{ marginTop: 20, padding: 12, background: '#F5F0EB', borderRadius: 8, fontSize: '0.8rem', color: '#6B6B6B' }}>
          <strong>Demo Giriş:</strong><br />
          E-posta: admin@turku.edu.tr<br />
          Şifre: admin123
        </div>
      </div>
    </div>
  );
}
