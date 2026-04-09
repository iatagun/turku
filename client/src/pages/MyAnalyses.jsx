import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function MyAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const res = await api.get('/analyses');
      setAnalyses(res.data);
    } catch {
      toast.error('Analizler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu analizi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/analyses/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success('Analiz silindi.');
    } catch {
      toast.error('Silme hatası.');
    }
  };

  const handleExport = async (ids = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = ids
        ? `/api/export/excel?ids=${ids.join(',')}`
        : '/api/export/excel?all=true';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      toast.success('Excel dosyası indirildi!');
    } catch {
      toast.error('Excel dışa aktarma hatası.');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const filtered = filter === 'all'
    ? analyses
    : analyses.filter(a => a.status === filter);

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📋 Analizlerim ({analyses.length})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && (
            <button className="btn btn-accent" onClick={() => handleExport([...selected])}>
              📥 Seçilenleri Excel'e Aktar ({selected.size})
            </button>
          )}
          <button className="btn btn-accent" onClick={() => handleExport()}>
            📥 Tümünü Excel'e Aktar
          </button>
          <Link to="/search" className="btn btn-primary">+ Yeni Analiz</Link>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: 'all', label: `Tümü (${analyses.length})` },
          { key: 'draft', label: `Taslak (${analyses.filter(a => a.status === 'draft').length})` },
          { key: 'completed', label: `Tamamlanan (${analyses.filter(a => a.status === 'completed').length})` },
        ].map(tab => (
          <button key={tab.key} className={filter === tab.key ? 'active' : ''} onClick={() => setFilter(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Henüz analiz bulunmuyor.</p>
          <Link to="/search" className="btn btn-primary mt-16">İlk Analizinizi Yapın →</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} />
                  </th>
                  <th>Türkü</th>
                  <th>Konu</th>
                  <th>Kullanılabilirlik</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                    </td>
                    <td>
                      <strong>{a.turku_adi || a.turku_name || '-'}</strong>
                      {a.trt_no && <div style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>TRT: {a.trt_no}</div>}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Array.isArray(a.konu) ? a.konu.join(', ') : '-'}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.kullanilabilirlik || '-'}
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'completed' ? 'badge-completed' : 'badge-draft'}`}>
                        {a.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#6B6B6B', whiteSpace: 'nowrap' }}>
                      {new Date(a.updated_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link to={`/analysis/${a.id}`} className="btn btn-sm btn-outline">Düzenle</Link>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Sil</button>
                      </div>
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
