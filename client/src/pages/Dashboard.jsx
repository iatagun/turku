import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [myStats, setMyStats] = useState({ total: 0, completed: 0, draft: 0 });
  const [platformStats, setPlatformStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/analyses').then(res => {
      const analyses = res.data;
      setMyStats({
        total: analyses.length,
        completed: analyses.filter(a => a.status === 'completed').length,
        draft: analyses.filter(a => a.status === 'draft').length,
      });
      setRecent(analyses.slice(0, 5));
    }).catch(() => {});

    api.get('/stats').then(res => {
      setPlatformStats(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Hoş Geldiniz, {user?.name}</h1>
      </div>

      {/* Platform İstatistikleri */}
      {platformStats && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFF8F5, #FAF5F0)', marginBottom: 24 }}>
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 8 }}>
            <h2>📊 Platform İstatistikleri</h2>
          </div>
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{platformStats.turkus.total}</div>
              <div className="stat-label">Toplam Türkü</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#28A745' }}>{platformStats.turkus.analyzed}</div>
              <div className="stat-label">Analiz Edilen</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#D4A017' }}>{platformStats.turkus.pending}</div>
              <div className="stat-label">Analiz Bekleyen</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#17A2B8' }}>{platformStats.completionRate}%</div>
              <div className="stat-label">Tamamlanma Oranı</div>
            </div>
          </div>
          {/* İlerleme çubuğu */}
          {platformStats.turkus.total > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6B6B6B', marginBottom: 4 }}>
                <span>{platformStats.turkus.analyzed} / {platformStats.turkus.total} türkü analiz edildi</span>
                <span>{platformStats.completionRate}%</span>
              </div>
              <div style={{ background: '#E5E1DC', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #28A745, #2C5F2D)',
                  height: '100%',
                  borderRadius: 8,
                  width: `${platformStats.completionRate}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kişisel İstatistikler */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{myStats.total}</div>
          <div className="stat-label">Analizlerim</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28A745' }}>{myStats.completed}</div>
          <div className="stat-label">Tamamladığım</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#D4A017' }}>{myStats.draft}</div>
          <div className="stat-label">Taslaklarım</div>
        </div>
      </div>

      {/* Hızlı Erişim */}
      <div className="card">
        <div className="card-header">
          <h2>Hızlı Erişim</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/queue" className="btn btn-primary btn-lg">📋 Türkü Listesi</Link>
          <Link to="/search" className="btn btn-secondary btn-lg">🔍 Türkü Ara</Link>
          <Link to="/my-analyses" className="btn btn-outline btn-lg">📝 Analizlerim</Link>
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
             className="btn btn-accent btn-lg">📥 Excel'e Aktar</a>
        </div>
      </div>

      {/* Analistler Tablosu */}
      {platformStats?.userStats?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>👥 Analist Performansı</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Analist</th>
                  <th>Tamamlanan</th>
                  <th>Taslak</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.userStats.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td><span className="badge badge-completed">{u.completed}</span></td>
                    <td><span className="badge badge-draft">{u.drafts}</span></td>
                    <td>{u.completed + u.drafts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Son Analizler */}
      {recent.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Son Analizlerim</h2>
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
