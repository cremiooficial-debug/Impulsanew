'use client';

import React, { useEffect } from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import Icon from '@/components/ui/AppIcon';
import {
  EMPTY_FRAME,
  EMPTY_ROW,
  PLASMANDO_TABS,
  emptyComponent,
  normalizeFrame,
  useLocalDraft,
  type LogicFrame,
  type LogicRow,
} from '@/app/arbol-problema/plasmando';

interface EditorProps {
  ownerId: string;
}

type RowField = keyof LogicRow;

const COLUMNS: { key: RowField; label: string; placeholder: string }[] = [
  { key: 'summary', label: 'Resumen narrativo', placeholder: 'Describe el nivel' },
  { key: 'indicators', label: 'Indicadores', placeholder: 'Ej: 20% más ventas en 12 meses' },
  { key: 'verification', label: 'Medios de verificación', placeholder: 'Ej: Registros de ventas' },
  { key: 'assumptions', label: 'Supuestos', placeholder: 'Ej: Estabilidad de precios' },
];

const MAX_COMPONENTS = 6;
const MAX_ACTIVITIES = 6;

interface RowFieldsProps {
  row: LogicRow;
  onChange: (field: RowField, value: string) => void;
}

const RowFields: React.FC<RowFieldsProps> = ({ row, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
    {COLUMNS.map((col) => (
      <label key={col.key} className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">
          {col.label}
        </span>
        <textarea
          value={row[col.key]}
          onChange={(e) => onChange(col.key, e.target.value)}
          placeholder={col.placeholder}
          rows={3}
          className="w-full resize-none rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 p-2.5 text-sm text-white placeholder:text-slate-500 font-medium outline-none transition-colors"
        />
      </label>
    ))}
  </div>
);

interface SingleLevelProps {
  title: string;
  hint: string;
  accent: string;
  row: LogicRow;
  onChange: (field: RowField, value: string) => void;
}

const SingleLevel: React.FC<SingleLevelProps> = ({ title, hint, accent, row, onChange }) => (
  <section className="rounded-3xl bg-[#0B2540]/75 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-xl">
    <div className="flex items-start gap-3 mb-4">
      <span
        className="shrink-0 w-1.5 self-stretch rounded-full"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div>
        <h2 className="text-white font-extrabold text-base sm:text-lg leading-snug">{title}</h2>
        <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{hint}</p>
      </div>
    </div>
    <div className="rounded-2xl bg-[#071628]/80 border border-white/10 p-3 sm:p-4">
      <RowFields row={row} onChange={onChange} />
    </div>
  </section>
);

const LogicFrameEditor: React.FC<EditorProps> = ({ ownerId }) => {
  const { value, update, setValue, loaded, savedAt } = useLocalDraft<LogicFrame>(
    ownerId,
    'marco-logico',
    EMPTY_FRAME
  );

  useEffect(() => {
    if (!loaded) return;
    const needsMigration =
      !Array.isArray(value.componentes) ||
      value.componentes.some((c) => !Array.isArray(c.activities)) ||
      'actividades' in (value as object);
    if (needsMigration) setValue(normalizeFrame(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const components = normalizeFrame(value).componentes;
  const safeFin = { ...EMPTY_ROW, ...(value?.fin ?? {}) };
  const safeProposito = { ...EMPTY_ROW, ...(value?.proposito ?? {}) };

  const setSingle = (level: 'fin' | 'proposito', field: RowField, text: string) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return { ...base, [level]: { ...base[level], [field]: text } };
    });

  const setComponentField = (ci: number, field: RowField, text: string) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return {
        ...base,
        componentes: base.componentes.map((c, i) => (i === ci ? { ...c, [field]: text } : c)),
      };
    });

  const addComponent = () =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return { ...base, componentes: [...base.componentes, emptyComponent()] };
    });

  const removeComponent = (ci: number) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return { ...base, componentes: base.componentes.filter((_, i) => i !== ci) };
    });

  const setActivityField = (ci: number, ai: number, field: RowField, text: string) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return {
        ...base,
        componentes: base.componentes.map((c, i) =>
          i === ci
            ? {
                ...c,
                activities: c.activities.map((a, j) => (j === ai ? { ...a, [field]: text } : a)),
              }
            : c
        ),
      };
    });

  const addActivity = (ci: number) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return {
        ...base,
        componentes: base.componentes.map((c, i) =>
          i === ci ? { ...c, activities: [...c.activities, { ...EMPTY_ROW }] } : c
        ),
      };
    });

  const removeActivity = (ci: number, ai: number) =>
    update((prev) => {
      const base = normalizeFrame(prev);
      return {
        ...base,
        componentes: base.componentes.map((c, i) =>
          i === ci ? { ...c, activities: c.activities.filter((_, j) => j !== ai) } : c
        ),
      };
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-slate-300 text-xs sm:text-sm font-medium">
          Matriz que resume tu proyecto: qué lograrás, cómo lo medirás y qué riesgos asumes. Cada
          componente agrupa sus propias actividades.
        </p>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 transition-opacity ${
            savedAt ? 'opacity-100' : 'opacity-0'
          }`}
          aria-live="polite"
        >
          <Icon name="CheckCircleIcon" size={14} />
          Guardado
        </span>
      </div>

      <SingleLevel
        title="Fin"
        hint="El objetivo de desarrollo al que contribuye tu proyecto."
        accent="#34D399"
        row={safeFin}
        onChange={(field, text) => setSingle('fin', field, text)}
      />
      <SingleLevel
        title="Propósito"
        hint="El resultado directo que logra tu proyecto al terminar."
        accent="#FF8F1C"
        row={safeProposito}
        onChange={(field, text) => setSingle('proposito', field, text)}
      />

      {components.map((component, ci) => (
        <section
          key={`componente-${ci}`}
          className="rounded-3xl bg-[#0B2540]/75 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-xl"
        >
          <div className="flex items-start gap-3 mb-4">
            <span
              className="shrink-0 w-1.5 self-stretch rounded-full"
              style={{ background: '#38BDF8' }}
              aria-hidden="true"
            />
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-base sm:text-lg leading-snug">
                Componente {ci + 1}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                El producto o servicio que entrega tu proyecto y las actividades para lograrlo.
              </p>
            </div>
            {components.length > 1 && (
              <button
                type="button"
                onClick={() => removeComponent(ci)}
                aria-label={`Eliminar Componente ${ci + 1}`}
                className="text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <Icon name="TrashIcon" size={18} />
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-[#071628]/80 border border-white/10 p-3 sm:p-4">
            <RowFields row={component} onChange={(field, text) => setComponentField(ci, field, text)} />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {component.activities.map((activity, ai) => (
              <div
                key={`actividad-${ci}-${ai}`}
                className="rounded-2xl bg-[#071628]/60 border border-[#A78BFA]/30 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wide">
                    Actividad {ci + 1}.{ai + 1}
                  </span>
                  {component.activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(ci, ai)}
                      aria-label={`Eliminar Actividad ${ci + 1}.${ai + 1}`}
                      className="text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <Icon name="TrashIcon" size={16} />
                    </button>
                  )}
                </div>
                <RowFields
                  row={activity}
                  onChange={(field, text) => setActivityField(ci, ai, field, text)}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addActivity(ci)}
            disabled={component.activities.length >= MAX_ACTIVITIES}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border border-white/10 text-slate-200 hover:text-[#A78BFA] hover:border-[#A78BFA]/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="PlusIcon" size={16} />
            <span>Agregar actividad</span>
          </button>
        </section>
      ))}

      <div>
        <button
          type="button"
          onClick={addComponent}
          disabled={components.length >= MAX_COMPONENTS}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border border-white/10 text-slate-200 hover:text-[#FF8F1C] hover:border-[#FF8F1C]/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="PlusIcon" size={16} />
          <span>Agregar componente</span>
        </button>
      </div>
    </div>
  );
};

export default function MarcoLogicoPage() {
  return (
    <CostosShell
      title="Marco"
      highlight="Lógico"
      subtitle="Organiza la metodología de formulación de tu proyecto en una matriz clara."
      tabs={PLASMANDO_TABS}
      navLabel="Plasmando la Idea"
    >
      {({ ownerId }) => <LogicFrameEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
