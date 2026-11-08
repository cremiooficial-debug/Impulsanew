'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface SaveStatusProps {
  savedAt: boolean;
  saveError: string;
  intro: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({ savedAt, saveError, intro }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p className="text-slate-300 text-xs sm:text-sm font-medium">{intro}</p>
    {saveError ? (
      <span role="alert" className="shrink-0 text-xs font-bold text-red-300">
        No se pudo guardar: {saveError}
      </span>
    ) : (
      <span
        className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 transition-opacity ${
          savedAt ? 'opacity-100' : 'opacity-0'
        }`}
        aria-live="polite"
      >
        <Icon name="CheckCircleIcon" size={14} />
        Guardado
      </span>
    )}
  </div>
);

interface SectionCardProps {
  title: string;
  hint?: string;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  hint,
  accent = '#FF8F1C',
  action,
  children,
}) => (
  <section className="rounded-3xl bg-[#0B2540]/75 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-xl">
    <div className="flex items-start gap-3 mb-4">
      <span
        className="shrink-0 w-1.5 self-stretch rounded-full"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <h2 className="text-white font-extrabold text-base sm:text-lg leading-snug">{title}</h2>
        {hint && <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  type?: 'text' | 'number' | 'date';
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows,
  type = 'text',
  className = '',
}) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">{label}</span>
    {rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 p-2.5 text-sm text-white placeholder:text-slate-500 font-medium outline-none transition-colors"
      />
    ) : (
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white placeholder:text-slate-500 font-medium outline-none transition-colors"
      />
    )}
  </label>
);

interface AddButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const AddButton: React.FC<AddButtonProps> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border border-white/10 text-slate-200 hover:text-[#FF8F1C] hover:border-[#FF8F1C]/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <Icon name="PlusIcon" size={16} />
    <span>{label}</span>
  </button>
);

interface RemoveButtonProps {
  label: string;
  onClick: () => void;
}

export const RemoveButton: React.FC<RemoveButtonProps> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="shrink-0 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
  >
    <Icon name="TrashIcon" size={16} />
  </button>
);

interface StatProps {
  label: string;
  value: string;
  accent?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, accent = '#FF8F1C' }) => (
  <div className="rounded-2xl bg-[#071628]/80 border border-white/10 p-3 sm:p-4">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-xl sm:text-2xl font-black mt-1" style={{ color: accent }}>
      {value}
    </p>
  </div>
);

export const ITEM_BOX =
  'rounded-2xl bg-[#071628]/80 border border-white/10 p-3 sm:p-4 focus-within:border-[#FF8F1C]/50 transition-colors';
