// GenerationSettings.tsx
import React from 'react';

type Strategy = 'random' | 'rating' | 'popularity';

export const GenerationSettings = ({ 
  strategy, 
  setStrategy 
}: { 
  strategy: Strategy; 
  setStrategy: (s: Strategy) => void 
}) => {
  const options: { id: Strategy; label: string }[] = [
    { id: 'random', label: 'Чистий рандом' },
    { id: 'rating', label: 'Високий рейтинг' },
    { id: 'popularity', label: 'Часто обирані' }, // Реалізовано як логіка по рейтингу в даному контексті
  ];

  return (
    <div className="grid grid-cols-1 gap-2 mb-4">
      <p className="text-[9px] font-black uppercase text-gray-500">Алгоритм генерації:</p>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setStrategy(opt.id)}
          className={`text-[10px] p-2 border-2 border-black font-black uppercase ${
            strategy === opt.id ? 'bg-[#00FF7F]' : 'bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};