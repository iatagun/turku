import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTurkuQueue } from '../hooks/useTurkuQueue';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import TurkuRow from '../components/TurkuRow';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

export default function TurkuQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    items, pagination, filter, loading, fetching,
    setFilter, setSearch, loadQueue, fetchAll,
  } = useTurkuQueue();

  const handleAnalyze = useCallback((turku) => {
    if (turku.completed_count > 0) {
      toast.error(`Bu türkünün analizi zaten tamamlanmış. (${turku.analyzed_by})`);
      return;
    }
    navigate(`/analysis/new/${turku.id}`);
  }, [navigate]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, [setSearch]);

  return (
    <div>
      <div className="page-header">
        <h1>📋 Türkü Listesi ({pagination.total})</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-accent" onClick={fetchAll} disabled={fetching}>
            {fetching ? '⏳ Çekiliyor...' : '🔄 Repertükülden Güncelle'}
          </button>
        )}
      </div>

      <SearchBar onSearch={handleSearch} />
      <FilterTabs active={filter} onChange={setFilter} />

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎵</div>
          <p>
            {pagination.total === 0
              ? 'Henüz türkü yüklenmemiş. Admin olarak "Repertükülden Güncelle" butonunu kullanın.'
              : 'Aramanızla eşleşen türkü bulunamadı.'}
          </p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Türkü Adı</th>
                    <th>Yöre</th>
                    <th>Durum</th>
                    <th>Analiz Eden</th>
                    <th style={{ width: 120 }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <TurkuRow
                      key={item.id}
                      item={item}
                      index={(pagination.page - 1) * pagination.limit + i + 1}
                      onAnalyze={handleAnalyze}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={loadQueue}
          />
        </>
      )}
    </div>
  );
}
