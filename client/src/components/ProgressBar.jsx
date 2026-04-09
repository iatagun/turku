import React from 'react';

const ProgressBar = React.memo(function ProgressBar({ current, total, rate }) {
  if (!total) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6B6B6B', marginBottom: 4 }}>
        <span>{current} / {total} türkü analiz edildi</span>
        <span>{rate}%</span>
      </div>
      <div style={{ background: '#E5E1DC', borderRadius: 8, height: 12, overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(90deg, #28A745, #2C5F2D)',
          height: '100%',
          borderRadius: 8,
          width: `${rate}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
});

export default ProgressBar;
