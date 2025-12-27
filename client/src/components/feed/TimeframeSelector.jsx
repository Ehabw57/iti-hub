import { useState } from 'react';

/**
 * Timeframe selector for trending feed
 * @param {Object} props
 * @param {string} props.selected - Currently selected timeframe
 * @param {Function} props.onChange - Change handler (timeframe) => void
 */
export default function TimeframeSelector({ selected, onChange }) {
  const timeframes = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {timeframes.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === value
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
