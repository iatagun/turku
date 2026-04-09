import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const REFRESH_INTERVAL = 30000; // 30sn auto-refresh

export function useTurkuQueue() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const intervalRef = useRef(null);

  const loadQueue = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filter !== 'all') params.filter = filter;
      if (search) params.search = search;
      const res = await api.get('/turku/queue', { params });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      if (!silent) toast.error('Türkü listesi yüklenemedi.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, search]);

  // İlk yükleme + filtre/arama değişimi
  useEffect(() => {
    loadQueue(1);
  }, [loadQueue]);

  // 30sn auto-refresh (30 kişi aynı anda çalışıyor)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadQueue(pagination.page, true);
    }, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [loadQueue, pagination.page]);

  const fetchAll = useCallback(async () => {
    if (!window.confirm('Repertükül sitesinden tüm türküler çekilecek. Devam edilsin mi?')) return;
    setFetching(true);
    try {
      const res = await api.post('/turku/fetch-all');
      toast.success(`${res.data.inserted} yeni türkü eklendi! Toplam: ${res.data.totalNow}`);
      loadQueue(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Türkü çekme hatası.');
    } finally {
      setFetching(false);
    }
  }, [loadQueue]);

  return {
    items, pagination, filter, search, loading, fetching,
    setFilter, setSearch, loadQueue, fetchAll,
  };
}
