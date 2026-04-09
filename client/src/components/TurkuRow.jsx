import React from 'react';

const TurkuRow = React.memo(function TurkuRow({ item, index, onAnalyze }) {
  const isCompleted = item.completed_count > 0;

  return (
    <tr style={isCompleted ? { background: '#f0faf0' } : undefined}>
      <td style={{ color: '#6B6B6B', fontSize: '0.85rem' }}>{index}</td>
      <td>
        <strong>{item.name}</strong>
        <div style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>
          {item.trt_no && <span>TRT: {item.trt_no} </span>}
          {item.has_lyrics ? (
            <span style={{ color: '#16a34a' }} title="Sözler mevcut">📜 Söz var</span>
          ) : (
            <span style={{ color: '#9ca3af' }} title="Sözler henüz çekilmedi">📜 Söz yok</span>
          )}
        </div>
      </td>
      <td style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
        {item.region || item.city || '-'}
      </td>
      <td>
        {isCompleted
          ? <span className="badge badge-completed">✅ Analiz Edildi</span>
          : item.draft_count > 0
            ? <span className="badge badge-draft">📝 Taslak Var</span>
            : <span className="badge badge-pending">⏳ Bekliyor</span>
        }
      </td>
      <td style={{ fontSize: '0.85rem' }}>{item.analyzed_by || '-'}</td>
      <td>
        {isCompleted ? (
          <span style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>Tamamlandı</span>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={() => onAnalyze(item)}>
            Analiz Yap →
          </button>
        )}
      </td>
    </tr>
  );
});

export default TurkuRow;
