'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { newId, type ProblemItem } from '../plasmando';

interface ItemListProps {
  label: string;
  hint: string;
  placeholder: string;
  addLabel: string;
  items: ProblemItem[];
  onChange: (items: ProblemItem[]) => void;
  tone: 'effect' | 'cause' | 'end' | 'mean';
  maxItems?: number;
}

const TONES: Record<ItemListProps['tone'], { border: string; badge: string; dot: string }> = {
  effect: {
    border: 'border-[#FF8F1C]/40',
    badge: 'text-[#FF8F1C] bg-[#FF8F1C]/10 border-[#FF8F1C]/30',
    dot: 'bg-[#FF8F1C]',
  },
  cause: {
    border: 'border-sky-400/40',
    badge: 'text-sky-300 bg-sky-400/10 border-sky-400/30',
    dot: 'bg-sky-400',
  },
  end: {
    border: 'border-emerald-400/40',
    badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
    dot: 'bg-emerald-400',
  },
  mean: {
    border: 'border-sky-400/40',
    badge: 'text-sky-300 bg-sky-400/10 border-sky-400/30',
    dot: 'bg-sky-400',
  },
};

const ItemList: React.FC<ItemListProps> = ({
  label,
  hint,
  placeholder,
  addLabel,
  items,
  onChange,
  tone,
  maxItems = 8,
}) => {
  const styles = TONES[tone];

  const updateText = (id: string, text: string) =>
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  const add = () => {
    if (items.length >= maxItems) return;
    onChange([...items, { id: newId(), text: '' }]);
  };

  return (
    <section
      className={`rounded-3xl bg-[#0B2540]/75 backdrop-blur-md border ${styles.border} p-4 sm:p-5 shadow-xl`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-white font-extrabold text-base sm:text-lg leading-snug">{label}</h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{hint}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${styles.badge}`}
        >
          {items.length}/{maxItems}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-400 text-sm font-medium py-3">Aún no hay elementos. {hint}</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="relative rounded-2xl bg-[#071628]/80 border border-white/10 p-3 focus-within:border-[#FF8F1C]/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className={`w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Eliminar elemento ${index + 1}`}
                  className="text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <Icon name="TrashIcon" size={16} />
                </button>
              </div>
              <textarea
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 font-medium outline-none"
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        disabled={items.length >= maxItems}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border border-white/10 text-slate-200 hover:text-[#FF8F1C] hover:border-[#FF8F1C]/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon name="PlusIcon" size={16} />
        <span>{addLabel}</span>
      </button>
    </section>
  );
};

export default ItemList;
