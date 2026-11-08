'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import Icon from '@/components/ui/AppIcon';
import ItemList from './components/ItemList';
import { EMPTY_PROBLEM_TREE, PLASMANDO_TABS, useLocalDraft, type ProblemTree } from './plasmando';

interface EditorProps {
  ownerId: string;
}

const ProblemTreeEditor: React.FC<EditorProps> = ({ ownerId }) => {
  const { value, update, savedAt } = useLocalDraft<ProblemTree>(
    ownerId,
    'arbol-problema',
    EMPTY_PROBLEM_TREE
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-slate-300 text-xs sm:text-sm font-medium">
          Lee el árbol de abajo hacia arriba: las causas generan el problema y este genera los
          efectos.
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

      <ItemList
        label="Efectos"
        hint="¿Qué consecuencias genera el problema?"
        placeholder="Ej: Pérdida de clientes por baja calidad"
        addLabel="Agregar efecto"
        tone="effect"
        items={value.effects}
        onChange={(effects) => update((prev) => ({ ...prev, effects }))}
      />

      <div className="flex justify-center text-[#FF8F1C]" aria-hidden="true">
        <Icon name="ArrowUpIcon" size={28} />
      </div>

      <section
        className="rounded-3xl p-4 sm:p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1A5A96 0%, #0F3A66 45%, #07192C 100%)',
          border: '1px solid rgba(255, 143, 28, 0.45)',
        }}
      >
        <h2 className="text-white font-extrabold text-base sm:text-lg">
          Problema <span style={{ color: '#FF8F1C' }}>central</span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5 mb-3">
          Describe en una frase la situación negativa que quieres resolver.
        </p>
        <textarea
          value={value.problem}
          onChange={(e) => update((prev) => ({ ...prev, problem: e.target.value }))}
          placeholder="Ej: Baja rentabilidad en la producción de mi emprendimiento"
          rows={3}
          aria-label="Problema central"
          className="w-full resize-none rounded-2xl bg-[#030C16]/70 border border-white/10 focus:border-[#FF8F1C]/70 p-3 text-sm sm:text-base text-white placeholder:text-slate-500 font-semibold outline-none transition-colors"
        />
      </section>

      <div className="flex justify-center text-sky-300" aria-hidden="true">
        <Icon name="ArrowUpIcon" size={28} />
      </div>

      <ItemList
        label="Causas"
        hint="¿Qué origina el problema?"
        placeholder="Ej: Falta de control de los costos de producción"
        addLabel="Agregar causa"
        tone="cause"
        items={value.causes}
        onChange={(causes) => update((prev) => ({ ...prev, causes }))}
      />
    </div>
  );
};

export default function ArbolProblemaPage() {
  return (
    <CostosShell
      title="Árbol del"
      highlight="Problema"
      subtitle="Identifica el problema central de tu proyecto, sus causas y sus efectos."
      tabs={PLASMANDO_TABS}
      navLabel="Plasmando la Idea"
    >
      {({ ownerId }) => <ProblemTreeEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
