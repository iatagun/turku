import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';

export default function Dashboard() {
  const { user } = useAuth();
  const { platformStats, myStats, recent } = useStats();

  const handleExport = useCallback((e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch('/api/export/excel?all=true', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      });
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
            <StatCard value={platformStats.turkus.total} label="Toplam Türkü" />
            <StatCard value={platformStats.turkus.analyzed} label="Analiz Edilen" color="#28A745" />
            <StatCard value={platformStats.turkus.pending} label="Analiz Bekleyen" color="#D4A017" />
            <StatCard value={`${platformStats.completionRate}%`} label="Tamamlanma Oranı" color="#17A2B8" />
            {platformStats.lyrics && (
              <StatCard
                value={`${platformStats.lyrics.withLyrics}/${platformStats.turkus.total}`}
                label="📜 Söz Çekildi"
                color="#8B5CF6"
              />
            )}
          </div>
          <ProgressBar
            current={platformStats.turkus.analyzed}
            total={platformStats.turkus.total}
            rate={platformStats.completionRate}
          />
        </div>
      )}

      {/* Kişisel İstatistikler */}
      <div className="stats-grid">
        <StatCard value={myStats.total} label="Analizlerim" />
        <StatCard value={myStats.completed} label="Tamamladığım" color="#28A745" />
        <StatCard value={myStats.draft} label="Taslaklarım" color="#D4A017" />
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
          <a href="/api/export/excel?all=true" onClick={handleExport} className="btn btn-accent btn-lg">📥 Excel'e Aktar</a>
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
                <tr><th>Analist</th><th>Tamamlanan</th><th>Taslak</th><th>Toplam</th></tr>
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
                <tr><th>Türkü</th><th>Durum</th><th>Tarih</th><th></th></tr>
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
