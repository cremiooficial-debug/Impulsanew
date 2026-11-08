'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import {
  EMPTY_DISTRIBUCION,
  GRID_COLS,
  GRID_ROWS,
  TECNICA_TABS,
  ZONE_COLORS,
  newId,
  toNumber,
  useTecnicaDraft,
  type DistribucionPlanta,
  type PlantZone,
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

const MAX_ZONES = 12;

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max);

const NumberSelect: React.FC<{
  label: string;
  value: number;
  max: number;
  min?: number;
  onChange: (n: number) => void;
}> = ({ label, value, max, min = 1, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white font-medium outline-none transition-colors"
    >
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
        <option key={n} value={n} className="bg-[#071628]">
          {n}
        </option>
      ))}
    </select>
  </label>
);

const DistribucionEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<DistribucionPlanta>(
    ownerId,
    'distribucion-planta',
    EMPTY_DISTRIBUCION
  );
  const zones: PlantZone[] = Array.isArray(value.zonas) ? value.zonas : [];

  const setField = (field: 'areaTotal' | 'flujo' | 'mejoras', text: string) =>
    update((prev) => ({ ...prev, [field]: text }));

  const patchZone = (id: string, patch: Partial<PlantZone>) =>
    update((prev) => ({
      ...prev,
      zonas: (prev.zonas ?? []).map((z) => {
        if (z.id !== id) return z;
        const next = { ...z, ...patch };
        next.col = clamp(next.col, 1, GRID_COLS);
        next.row = clamp(next.row, 1, GRID_ROWS);
        next.colSpan = clamp(next.colSpan, 1, GRID_COLS - next.col + 1);
        next.rowSpan = clamp(next.rowSpan, 1, GRID_ROWS - next.row + 1);
        return next;
      }),
    }));

  const addZone = () =>
    update((prev) => {
      const list = prev.zonas ?? [];
      return {
        ...prev,
        zonas: [
          ...list,
          {
            id: newId(),
            name: '',
            area: '',
            color: ZONE_COLORS[list.length % ZONE_COLORS.length],
            col: 1,
            row: 1,
            colSpan: 2,
            rowSpan: 1,
          },
        ],
      };
    });

  const removeZone = (id: string) =>
    update((prev) => ({ ...prev, zonas: (prev.zonas ?? []).filter((z) => z.id !== id) }));

  const totalArea = toNumber(value.areaTotal);
  const usedArea = zones.reduce((sum, z) => sum + toNumber(z.area), 0);
  const usedPct = totalArea > 0 ? Math.round((usedArea / totalArea) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Organiza el espacio de trabajo en zonas, ubícalas en el plano y analiza cómo se mueven personas y materiales para ahorrar tiempo y costos."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Zonas definidas" value={String(zones.length)} accent="#38BDF8" />
        <Stat label="Área asignada (m²)" value={usedArea.toLocaleString('es-VE')} accent="#FF8F1C" />
        <Stat
          label="Uso del área total"
          value={totalArea > 0 ? `${usedPct}%` : '—'}
          accent={usedPct > 100 ? '#F87171' : '#34D399'}
        />
      </div>

      <SectionCard
        title="Plano esquemático"
        hint="Cada zona se ubica en una cuadrícula que representa tu espacio. Ajusta posición y tamaño en las tarjetas de abajo."
        accent="#FF8F1C"
      >
        <div className="rounded-2xl bg-[#071628]/80 border border-white/10 p-3">
          <div
            className="grid gap-1.5 w-full"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_ROWS}, minmax(52px, 1fr))`,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: `${100 / GRID_COLS}% ${100 / GRID_ROWS}%`,
            }}
            role="img"
            aria-label="Plano esquemático de la distribución en planta"
          >
            {zones.map((z, index) => (
              <div
                key={z.id}
                className="rounded-xl p-2 flex flex-col justify-center items-center text-center overflow-hidden border"
                style={{
                  gridColumn: `${z.col} / span ${z.colSpan}`,
                  gridRow: `${z.row} / span ${z.rowSpan}`,
                  background: `${z.color}33`,
                  borderColor: `${z.color}99`,
                }}
              >
                <span className="text-white text-xs font-extrabold leading-tight break-words">
                  {z.name || `Zona ${index + 1}`}
                </span>
                {z.area && (
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: z.color }}>
                    {z.area} m²
                  </span>
                )}
              </div>
            ))}
          </div>
          {zones.length === 0 && (
            <p className="text-slate-400 text-sm font-medium text-center pt-3">
              Agrega zonas para ver tu plano.
            </p>
          )}
        </div>
        <div className="mt-4 max-w-xs">
          <Field
            label="Área total disponible (m²)"
            type="number"
            value={value.areaTotal}
            onChange={(t) => setField('areaTotal', t)}
            placeholder="Ej: 60"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Zonas del espacio"
        hint="Oficina, taller, cocina, almacén, recepción, servidores..."
        accent="#38BDF8"
        action={
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border text-sky-300 bg-sky-400/10 border-sky-400/30">
            {zones.length}/{MAX_ZONES}
          </span>
        }
      >
        {zones.length > 0 && (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {zones.map((z, index) => (
              <li key={z.id} className={ITEM_BOX}>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: z.color }}
                      aria-hidden="true"
                    />
                    Zona {index + 1}
                  </span>
                  <RemoveButton
                    label={`Eliminar zona ${index + 1}`}
                    onClick={() => removeZone(z.id)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Nombre"
                    value={z.name}
                    onChange={(t) => patchZone(z.id, { name: t })}
                    placeholder="Ej: Almacén"
                  />
                  <Field
                    label="Área (m²)"
                    type="number"
                    value={z.area}
                    onChange={(t) => patchZone(z.id, { area: t })}
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <NumberSelect
                    label="Columna"
                    value={z.col}
                    max={GRID_COLS}
                    onChange={(n) => patchZone(z.id, { col: n })}
                  />
                  <NumberSelect
                    label="Fila"
                    value={z.row}
                    max={GRID_ROWS}
                    onChange={(n) => patchZone(z.id, { row: n })}
                  />
                  <NumberSelect
                    label="Ancho"
                    value={z.colSpan}
                    max={GRID_COLS - z.col + 1}
                    onChange={(n) => patchZone(z.id, { colSpan: n })}
                  />
                  <NumberSelect
                    label="Alto"
                    value={z.rowSpan}
                    max={GRID_ROWS - z.row + 1}
                    onChange={(n) => patchZone(z.id, { rowSpan: n })}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3" role="group" aria-label="Color de la zona">
                  {ZONE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patchZone(z.id, { color: c })}
                      aria-label={`Color ${c}`}
                      aria-pressed={z.color === c}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                        z.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className={zones.length > 0 ? 'mt-4' : ''}>
          <AddButton label="Agregar zona" onClick={addZone} disabled={zones.length >= MAX_ZONES} />
        </div>
      </SectionCard>

      <SectionCard
        title="Análisis de flujo de movimiento"
        hint="Cómo se desplazan materiales, personas e información entre zonas."
        accent="#34D399"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Field
            label="Recorrido actual"
            value={value.flujo}
            onChange={(t) => setField('flujo', t)}
            placeholder="Ej: Insumos entran por almacén → cocina → empaque → despacho. Distancia aprox. 18 m."
            rows={5}
          />
          <Field
            label="Mejoras para reducir tiempos y costos"
            value={value.mejoras}
            onChange={(t) => setField('mejoras', t)}
            placeholder="Ej: Acercar el empaque a la cocina para eliminar un traslado de 8 m."
            rows={5}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default function DistribucionPlantaPage() {
  return (
    <CostosShell
      title="Distribución en"
      highlight="Planta"
      subtitle="Diseña la disposición física de tu espacio de trabajo."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <DistribucionEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
