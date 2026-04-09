import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useStats() {
  const [platformStats, setPlatformStats] = useState(null);
  const [myStats, setMyStats] = useState({ total: 0, completed: 0, draft: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analysesRes] = await Promise.all([
        api.get('/stats'),
        api.get('/analyses'),
      ]);
      setPlatformStats(statsRes.data);

      const analyses = analysesRes.data;
      setMyStats({
        total: analyses.length,
        completed: analyses.filter(a => a.status === 'completed').length,
        draft: analyses.filter(a => a.status === 'draft').length,
      });
      setRecent(analyses.slice(0, 5));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { platformStats, myStats, recent, loading, refresh };
}
