
import React from 'react';

interface WaveVisualizationProps {
  x: number;
  y: number;
}

const WaveVisualization: React.FC<WaveVisualizationProps> = ({ x, y }) => {
  // Normalize and use values to influence wave properties
  // Simple mapping: y affects amplitude, x affects frequency
  const amplitude = Math.max(10, 20 + Math.abs(y) * 2); 
  const frequency = 0.05 + Math.abs(x) * 0.005; 
  const points = [];
  const width = 500;
  const height = 200;

  for (let i = 0; i <= width; i++) {
    const pointX = i;
    const pointY = height / 2 + amplitude * Math.sin(i * frequency);
    points.push(`${pointX},${pointY}`);
  }

  const path = `M0,${height / 2} L${points.join(' ')} L${width},${height / 2} L${width},${height} L0,${height} Z`;

  return (
    <div className="w-full my-4 p-4 bg-blue-200 rounded-lg shadow-inner">
      <h3 className="text-center font-semibold text-lg text-blue-800 mb-2">Sua Onda Perfeita!</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#waveGradient)" />
      </svg>
    </div>
  );
};

export default WaveVisualization;
