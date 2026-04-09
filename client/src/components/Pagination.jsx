import React from 'react';

const Pagination = React.memo(function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      <button
        className="btn btn-sm btn-outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Önceki
      </button>
      <span style={{ fontSize: '0.9rem', color: '#6B6B6B' }}>
        Sayfa {page} / {totalPages}
      </span>
      <button
        className="btn btn-sm btn-outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sonraki →
      </button>
    </div>
  );
});

export default Pagination;
