import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, draft: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/analyses').then(res => {
      const analyses = res.data;
      setStats({
        total: analyses.length,
        completed: analyses.filter(a => a.status === 'completed').length,
        draft: analyses.filter(a => a.status === 'draft').length,
      });
      setRecent(analyses.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Hoş Geldiniz, {user?.name}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Toplam Analiz</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28A745' }}>{stats.completed}</div>
          <div className="stat-label">Tamamlanan</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#D4A017' }}>{stats.draft}</div>
          <div className="stat-label">Taslak</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Hızlı Erişim</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/search" className="btn btn-primary btn-lg">🔍 Türkü Ara & Analiz Yap</Link>
          <Link to="/my-analyses" className="btn btn-secondary btn-lg">📋 Analizlerim</Link>
          <a href={`/api/export/excel?all=true`}
             onClick={(e) => {
               e.preventDefault();
               const token = localStorage.getItem('token');
               fetch('/api/export/excel?all=true', { headers: { Authorization: `Bearer ${token}` } })
                 .then(res => res.blob())
                 .then(blob => {
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = `Turku-Analizleri-${new Date().toISOString().slice(0,10)}.xlsx`;
                   a.click();
                 });
             }}
             className="btn btn-accent btn-lg">📥 Tümünü Excel'e Aktar</a>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Son Analizler</h2>
            <Link to="/my-analyses" className="btn btn-sm btn-outline">Tümünü Gör</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Türkü</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(a => (
                  <tr key={a.id}>
                    <td>{a.turku_adi || a.turku_name || '-'}</td>
                    <td>
                      <span className={`badge ${a.status === 'completed' ? 'badge-completed' : 'badge-draft'}`}>
                        {a.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
                      {new Date(a.updated_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      <Link to={`/analysis/${a.id}`} className="btn btn-sm btn-outline">Düzenle</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
