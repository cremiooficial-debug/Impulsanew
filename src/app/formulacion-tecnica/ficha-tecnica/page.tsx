'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import {
  EMPTY_FICHA,
  TECNICA_TABS,
  newId,
  useTecnicaDraft,
  type FichaTecnica,
} from '../tecnica';
import {
  AddButton,
  Field,
  ITEM_BOX,
  RemoveButton,
  SaveStatus,
  SectionCard,
} from '../components/TecnicaUi';

const MAX_SPECS = 12;

const FichaEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<FichaTecnica>(
    ownerId,
    'ficha-tecnica',
    EMPTY_FICHA
  );
  const specs = Array.isArray(value.caracteristicas) ? value.caracteristicas : [];

  const setField = (field: keyof Omit<FichaTecnica, 'caracteristicas'>, text: string) =>
    update((prev) => ({ ...prev, [field]: text }));

  const setSpec = (id: string, field: 'name' | 'detail', text: string) =>
    update((prev) => ({
      ...prev,
      caracteristicas: (prev.caracteristicas ?? []).map((s) =>
        s.id === id ? { ...s, [field]: text } : s
      ),
    }));

  const addSpec = () =>
    update((prev) => ({
      ...prev,
      caracteristicas: [...(prev.caracteristicas ?? []), { id: newId(), name: '', detail: '' }],
    }));

  const removeSpec = (id: string) =>
    update((prev) => ({
      ...prev,
      caracteristicas: (prev.caracteristicas ?? []).filter((s) => s.id !== id),
    }));

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Describe con precisión qué ofreces: sus características, el diseño, los materiales o la tecnología que lo hacen posible."
      />

      <SectionCard
        title="Descripción del producto o servicio"
        hint="¿Qué es, para qué sirve y qué lo hace distinto?"
        accent="#FF8F1C"
      >
        <Field
          label="Descripción detallada"
          value={value.descripcion}
          onChange={(t) => setField('descripcion', t)}
          placeholder="Ej: Mermelada artesanal de guayaba en frasco de vidrio de 250 g, sin conservantes..."
          rows={5}
        />
      </SectionCard>

      <SectionCard
        title="Características técnicas"
        hint="Peso, dimensiones, vida útil, capacidad, rendimiento, normas, etc."
        accent="#38BDF8"
        action={
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border text-sky-300 bg-sky-400/10 border-sky-400/30">
            {specs.length}/{MAX_SPECS}
          </span>
        }
      >
        {specs.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-2">
            Aún no hay características. Agrega la primera.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specs.map((spec, index) => (
              <li key={spec.id} className={ITEM_BOX}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Característica {index + 1}
                  </span>
                  <RemoveButton
                    label={`Eliminar característica ${index + 1}`}
                    onClick={() => removeSpec(spec.id)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Field
                    label="Nombre"
                    value={spec.name}
                    onChange={(t) => setSpec(spec.id, 'name', t)}
                    placeholder="Ej: Peso neto"
                  />
                  <Field
                    label="Especificación"
                    value={spec.detail}
                    onChange={(t) => setSpec(spec.id, 'detail', t)}
                    placeholder="Ej: 250 g ± 5 g"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <AddButton label="Agregar característica" onClick={addSpec} disabled={specs.length >= MAX_SPECS} />
        </div>
      </SectionCard>

      <SectionCard
        title="Diseño, materiales y tecnología"
        hint="Las especificaciones que definen cómo está hecho."
        accent="#34D399"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Field
            label="Especificaciones de diseño"
            value={value.diseno}
            onChange={(t) => setField('diseno', t)}
            placeholder="Forma, dimensiones, empaque, acabado, identidad visual..."
            rows={5}
          />
          <Field
            label="Materiales"
            value={value.materiales}
            onChange={(t) => setField('materiales', t)}
            placeholder="Materias primas, insumos y calidades requeridas..."
            rows={5}
          />
          <Field
            label="Tecnología o software"
            value={value.tecnologia}
            onChange={(t) => setField('tecnologia', t)}
            placeholder="Equipos, plataformas, licencias o técnicas empleadas..."
            rows={5}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Planos, diagramas y esquemas"
        hint="Si aplica: describe o enlaza planos, diagramas de flujo del servicio o esquemas conceptuales."
        accent="#A78BFA"
      >
        <Field
          label="Descripción de planos y enlaces"
          value={value.diagramas}
          onChange={(t) => setField('diagramas', t)}
          placeholder="Ej: Plano de envase (enlace a carpeta compartida), esquema conceptual del servicio de entrega..."
          rows={4}
        />
      </SectionCard>
    </div>
  );
};

export default function FichaTecnicaPage() {
  return (
    <CostosShell
      title="Ficha"
      highlight="Técnica"
      subtitle="Detalla las características técnicas de tu producto o servicio."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <FichaEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
