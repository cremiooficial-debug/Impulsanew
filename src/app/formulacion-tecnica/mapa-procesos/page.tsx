'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import Icon from '@/components/ui/AppIcon';
import {
  EMPTY_MAPA,
  TECNICA_TABS,
  newId,
  useTecnicaDraft,
  type MapaProcesos,
  type ProcessStep,
} from '../tecnica';
import {
  AddButton,
  Field,
  ITEM_BOX,
  RemoveButton,
  SaveStatus,
  SectionCard,
} from '../components/TecnicaUi';

const MAX_STEPS = 12;
const MAX_TAGS = 8;

type TagKey = 'estrategicos' | 'principales' | 'apoyo';

const TAG_GROUPS: { key: TagKey; title: string; hint: string; accent: string; placeholder: string }[] = [
  {
    key: 'estrategicos',
    title: 'Procesos estratégicos',
    hint: 'Dirigen y definen el rumbo del negocio.',
    accent: '#A78BFA',
    placeholder: 'Ej: Planificación, Gestión de la calidad',
  },
  {
    key: 'principales',
    title: 'Procesos principales',
    hint: 'Crean directamente el producto o servicio.',
    accent: '#FF8F1C',
    placeholder: 'Ej: Producción, Empaque, Entrega',
  },
  {
    key: 'apoyo',
    title: 'Procesos de apoyo',
    hint: 'Sostienen la operación.',
    accent: '#38BDF8',
    placeholder: 'Ej: Compras, Mantenimiento, Contabilidad',
  },
];

interface TagListProps {
  items: string[];
  placeholder: string;
  accent: string;
  onChange: (items: string[]) => void;
}

const TagList: React.FC<TagListProps> = ({ items, placeholder, accent, onChange }) => (
  <div className="flex flex-col gap-2">
    {items.map((text, index) => (
      <div key={`tag-${index}`} className="flex items-center gap-2">
        <span
          className="shrink-0 w-2 h-2 rounded-full"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(items.map((t, i) => (i === index ? e.target.value : t)))}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white placeholder:text-slate-500 font-medium outline-none transition-colors"
        />
        <RemoveButton
          label={`Eliminar proceso ${index + 1}`}
          onClick={() => onChange(items.filter((_, i) => i !== index))}
        />
      </div>
    ))}
    <div className="mt-1">
      <AddButton
        label="Agregar proceso"
        onClick={() => onChange([...items, ''])}
        disabled={items.length >= MAX_TAGS}
      />
    </div>
  </div>
);

const MapaEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<MapaProcesos>(
    ownerId,
    'mapa-procesos',
    EMPTY_MAPA
  );
  const steps: ProcessStep[] = Array.isArray(value.pasos) ? value.pasos : [];

  const setTop = (field: 'entrada' | 'salida', text: string) =>
    update((prev) => ({ ...prev, [field]: text }));

  const setTags = (key: TagKey, items: string[]) => update((prev) => ({ ...prev, [key]: items }));

  const setStep = (id: string, field: keyof Omit<ProcessStep, 'id'>, text: string) =>
    update((prev) => ({
      ...prev,
      pasos: (prev.pasos ?? []).map((s) => (s.id === id ? { ...s, [field]: text } : s)),
    }));

  const addStep = () =>
    update((prev) => ({
      ...prev,
      pasos: [
        ...(prev.pasos ?? []),
        { id: newId(), name: '', description: '', responsable: '' },
      ],
    }));

  const removeStep = (id: string) =>
    update((prev) => ({ ...prev, pasos: (prev.pasos ?? []).filter((s) => s.id !== id) }));

  const moveStep = (index: number, direction: -1 | 1) =>
    update((prev) => {
      const list = [...(prev.pasos ?? [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, pasos: list };
    });

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Dibuja el recorrido completo: desde que recibes los insumos hasta que entregas al cliente, e identifica qué procesos son estratégicos, principales y de apoyo."
      />

      <SectionCard
        title="Flujo paso a paso"
        hint="Ordena las etapas desde la recepción de insumos hasta la entrega final."
        accent="#FF8F1C"
        action={
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border text-[#FF8F1C] bg-[#FF8F1C]/10 border-[#FF8F1C]/30">
            {steps.length}/{MAX_STEPS}
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Field
            label="Punto de inicio (insumos)"
            value={value.entrada}
            onChange={(t) => setTop('entrada', t)}
            placeholder="Ej: Recepción de materia prima"
          />
          <Field
            label="Punto final (entrega)"
            value={value.salida}
            onChange={(t) => setTop('salida', t)}
            placeholder="Ej: Entrega al cliente final"
          />
        </div>

        <ol className="flex flex-col">
          <li className="flex items-center gap-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <Icon name="ArrowDownTrayIcon" size={16} />
            </span>
            <span className="text-sm font-bold text-emerald-300">
              Inicio: {value.entrada || 'Recepción de insumos'}
            </span>
          </li>

          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 w-9">
                <span className="w-px h-4 bg-white/20" aria-hidden="true" />
                <span className="w-9 h-9 rounded-full bg-[#FF8F1C] text-[#030C16] font-black text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="w-px flex-1 min-h-4 bg-white/20" aria-hidden="true" />
              </div>
              <div className={`${ITEM_BOX} flex-1 my-2`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Etapa {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      aria-label={`Subir etapa ${index + 1}`}
                      className="text-slate-400 hover:text-[#FF8F1C] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="ChevronUpIcon" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      aria-label={`Bajar etapa ${index + 1}`}
                      className="text-slate-400 hover:text-[#FF8F1C] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Icon name="ChevronDownIcon" size={16} />
                    </button>
                    <RemoveButton
                      label={`Eliminar etapa ${index + 1}`}
                      onClick={() => removeStep(step.id)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field
                    label="Etapa"
                    value={step.name}
                    onChange={(t) => setStep(step.id, 'name', t)}
                    placeholder="Ej: Cocción"
                  />
                  <Field
                    label="Responsable"
                    value={step.responsable}
                    onChange={(t) => setStep(step.id, 'responsable', t)}
                    placeholder="Ej: Jefe de producción"
                  />
                  <Field
                    label="Qué ocurre"
                    value={step.description}
                    onChange={(t) => setStep(step.id, 'description', t)}
                    placeholder="Descripción breve"
                  />
                </div>
              </div>
            </li>
          ))}

          <li className="flex items-center gap-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-sky-400/15 border border-sky-400/40 text-sky-300 flex items-center justify-center">
              <Icon name="FlagIcon" size={16} />
            </span>
            <span className="text-sm font-bold text-sky-300">
              Fin: {value.salida || 'Entrega al cliente'}
            </span>
          </li>
        </ol>

        <div className="mt-4">
          <AddButton label="Agregar etapa" onClick={addStep} disabled={steps.length >= MAX_STEPS} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {TAG_GROUPS.map((group) => (
          <SectionCard key={group.key} title={group.title} hint={group.hint} accent={group.accent}>
            <TagList
              items={Array.isArray(value[group.key]) ? value[group.key] : []}
              placeholder={group.placeholder}
              accent={group.accent}
              onChange={(items) => setTags(group.key, items)}
            />
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default function MapaProcesosPage() {
  return (
    <CostosShell
      title="Mapa de"
      highlight="Procesos"
      subtitle="Visualiza cómo fluye tu operación de principio a fin."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <MapaEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
