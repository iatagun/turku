import React from 'react';

const TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: '⏳ Analiz Bekleyen' },
  { key: 'completed', label: '✅ Analiz Edilenler' },
];

const FilterTabs = React.memo(function FilterTabs({ active, onChange }) {
  return (
    <div className="tabs">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={active === tab.key ? 'active' : ''}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

export default FilterTabs;
