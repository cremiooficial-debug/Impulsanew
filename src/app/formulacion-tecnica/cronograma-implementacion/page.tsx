'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import {
  EMPTY_CRONOGRAMA,
  MILESTONE_CATEGORIES,
  TECNICA_TABS,
  newId,
  toNumber,
  useTecnicaDraft,
  type Cronograma,
  type Milestone,
} from '../tecnica';
import {
  AddButton,
  Field,
  ITEM_BOX,
  RemoveButton,
  SaveStatus,
  SectionCard,
  Stat,
} from '../components/TecnicaUi';

const MAX_MILESTONES = 20;
const MAX_WEEKS = 52;

const CATEGORY_COLORS: Record<string, string> = {
  'Adquisición de equipos': '#38BDF8',
  'Permisos y licencias': '#A78BFA',
  'Adecuación del espacio': '#FACC15',
  Contratación: '#F472B6',
  'Pruebas piloto': '#34D399',
  'Inicio de operaciones': '#FF8F1C',
};

const colorFor = (category: string): string => CATEGORY_COLORS[category] ?? '#94A3B8';

const CronogramaEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<Cronograma>(
    ownerId,
    'cronograma-implementacion',
    EMPTY_CRONOGRAMA
  );
  const items: Milestone[] = Array.isArray(value.hitos) ? value.hitos : [];

  const setMilestone = (id: string, patch: Partial<Milestone>) =>
    update((prev) => ({
      ...prev,
      hitos: (prev.hitos ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));

  const addMilestone = () =>
    update((prev) => ({
      ...prev,
      hitos: [
        ...(prev.hitos ?? []),
        {
          id: newId(),
          name: '',
          category: MILESTONE_CATEGORIES[0],
          startWeek: '1',
          durationWeeks: '1',
          critical: false,
          notes: '',
        },
      ],
    }));

  const removeMilestone = (id: string) =>
    update((prev) => ({ ...prev, hitos: (prev.hitos ?? []).filter((m) => m.id !== id) }));

  const parsed = items.map((m) => {
    const start = Math.max(Math.round(toNumber(m.startWeek)), 1);
    const duration = Math.max(Math.round(toNumber(m.durationWeeks)), 1);
    return { ...m, start, duration, end: start + duration - 1 };
  });
  const totalWeeks = Math.min(Math.max(...parsed.map((m) => m.end), 0), MAX_WEEKS);
  const criticalItems = parsed.filter((m) => m.critical);
  const criticalWeeks = criticalItems.length > 0 ? Math.max(...criticalItems.map((m) => m.end)) : 0;
  const scale = Math.max(totalWeeks, 8);

  const weekMarks = Array.from({ length: scale }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Planifica la puesta en marcha: adquisición de equipos, permisos, pruebas piloto e inicio de operaciones. Marca los hitos de la ruta crítica."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Hitos planificados" value={String(items.length)} accent="#38BDF8" />
        <Stat label="Duración total" value={`${totalWeeks} sem`} accent="#FF8F1C" />
        <Stat
          label="Ruta crítica"
          value={criticalWeeks > 0 ? `${criticalWeeks} sem` : '—'}
          accent="#F87171"
        />
      </div>

      <SectionCard
        title="Diagrama de Gantt"
        hint="Cada barra muestra cuándo inicia y cuánto dura un hito. Los de la ruta crítica llevan borde rojo."
        accent="#FF8F1C"
      >
        {parsed.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-1">
            Agrega hitos para ver el cronograma.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-[#071628]/60 border border-white/10 p-3">
            <div className="min-w-[640px]">
              <div className="flex">
                <div className="w-40 shrink-0" />
                <div
                  className="flex-1 grid"
                  style={{ gridTemplateColumns: `repeat(${scale}, minmax(0, 1fr))` }}
                >
                  {weekMarks.map((w) => (
                    <span
                      key={w}
                      className="text-[10px] font-bold text-slate-500 text-center border-l border-white/5"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              {parsed.map((m, index) => (
                <div key={m.id} className="flex items-center mt-1.5">
                  <span className="w-40 shrink-0 pr-2 text-xs font-bold text-slate-200 truncate">
                    {m.name || `Hito ${index + 1}`}
                  </span>
                  <div
                    className="flex-1 grid h-7"
                    style={{ gridTemplateColumns: `repeat(${scale}, minmax(0, 1fr))` }}
                  >
                    <div
                      className="rounded-md flex items-center px-1.5 overflow-hidden"
                      style={{
                        gridColumn: `${Math.min(m.start, scale)} / span ${Math.min(
                          m.duration,
                          scale - Math.min(m.start, scale) + 1
                        )}`,
                        background: `${colorFor(m.category)}55`,
                        border: m.critical
                          ? '2px solid #F87171'
                          : `1px solid ${colorFor(m.category)}`,
                      }}
                    >
                      <span className="text-[10px] font-extrabold text-white whitespace-nowrap">
                        {m.duration} sem
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-[10px] font-bold text-slate-500 mt-2 pl-40">Semanas</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Hitos de implementación"
        hint="Equipos, permisos, adecuaciones, contratación, pruebas piloto y arranque."
        accent="#38BDF8"
        action={
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border text-sky-300 bg-sky-400/10 border-sky-400/30">
            {items.length}/{MAX_MILESTONES}
          </span>
        }
      >
        <div className="max-w-xs mb-4">
          <Field
            label="Fecha estimada de inicio del proyecto"
            type="date"
            value={value.inicio}
            onChange={(t) => update((prev) => ({ ...prev, inicio: t }))}
          />
        </div>

        {items.length > 0 && (
          <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {items.map((m, index) => (
              <li key={m.id} className={ITEM_BOX}>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: colorFor(m.category) }}
                      aria-hidden="true"
                    />
                    Hito {index + 1}
                  </span>
                  <RemoveButton
                    label={`Eliminar hito ${index + 1}`}
                    onClick={() => removeMilestone(m.id)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field
                    label="Actividad"
                    value={m.name}
                    onChange={(t) => setMilestone(m.id, { name: t })}
                    placeholder="Ej: Compra del horno industrial"
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">
                      Tipo
                    </span>
                    <select
                      value={m.category}
                      onChange={(e) => setMilestone(m.id, { category: e.target.value })}
                      className="w-full rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white font-medium outline-none transition-colors"
                    >
                      {MILESTONE_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#071628]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Field
                    label="Semana de inicio"
                    type="number"
                    value={m.startWeek}
                    onChange={(t) => setMilestone(m.id, { startWeek: t })}
                    placeholder="1"
                  />
                  <Field
                    label="Duración (semanas)"
                    type="number"
                    value={m.durationWeeks}
                    onChange={(t) => setMilestone(m.id, { durationWeeks: t })}
                    placeholder="1"
                  />
                </div>
                <Field
                  label="Notas"
                  value={m.notes}
                  onChange={(t) => setMilestone(m.id, { notes: t })}
                  placeholder="Dependencias, responsables, observaciones"
                  rows={2}
                  className="mt-2"
                />
                <label className="mt-3 inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.critical}
                    onChange={(e) => setMilestone(m.id, { critical: e.target.checked })}
                    className="w-4 h-4 accent-[#F87171] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Forma parte de la ruta crítica
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className={items.length > 0 ? 'mt-4' : ''}>
          <AddButton
            label="Agregar hito"
            onClick={addMilestone}
            disabled={items.length >= MAX_MILESTONES}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default function CronogramaImplementacionPage() {
  return (
    <CostosShell
      title="Cronograma de"
      highlight="Implementación"
      subtitle="Ordena los tiempos para poner tu emprendimiento en marcha."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <CronogramaEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
