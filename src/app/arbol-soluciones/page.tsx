'use client';

import React from 'react';
import Link from 'next/link';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import Icon from '@/components/ui/AppIcon';
import ItemList from '@/app/arbol-problema/components/ItemList';
import {
  EMPTY_SOLUTION_TREE,
  PLASMANDO_TABS,
  useLocalDraft,
  type SolutionTree,
} from '@/app/arbol-problema/plasmando';

interface EditorProps {
  ownerId: string;
}

const SolutionTreeEditor: React.FC<EditorProps> = ({ ownerId }) => {
  const { value, update, savedAt } = useLocalDraft<SolutionTree>(
    ownerId,
    'arbol-soluciones',
    EMPTY_SOLUTION_TREE
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-slate-300 text-xs sm:text-sm font-medium">
          Convierte cada situación negativa en una situación positiva: causas en medios, problema
          en objetivo y efectos en fines.
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
        label="Fines"
        hint="¿Qué beneficios se logran al resolver el problema?"
        placeholder="Ej: Aumento de clientes satisfechos"
        addLabel="Agregar fin"
        tone="end"
        items={value.ends}
        onChange={(ends) => update((prev) => ({ ...prev, ends }))}
      />

      <div className="flex justify-center text-emerald-300" aria-hidden="true">
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
          Objetivo <span style={{ color: '#FF8F1C' }}>central</span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5 mb-3">
          Es el problema central expresado como una situación ya resuelta.
        </p>
        <textarea
          value={value.objective}
          onChange={(e) => update((prev) => ({ ...prev, objective: e.target.value }))}
          placeholder="Ej: Alta rentabilidad en la producción de mi emprendimiento"
          rows={3}
          aria-label="Objetivo central"
          className="w-full resize-none rounded-2xl bg-[#030C16]/70 border border-white/10 focus:border-[#FF8F1C]/70 p-3 text-sm sm:text-base text-white placeholder:text-slate-500 font-semibold outline-none transition-colors"
        />
      </section>

      <div className="flex justify-center text-sky-300" aria-hidden="true">
        <Icon name="ArrowUpIcon" size={28} />
      </div>

      <ItemList
        label="Medios"
        hint="¿Qué acciones permiten alcanzar el objetivo?"
        placeholder="Ej: Control mensual de costos de producción"
        addLabel="Agregar medio"
        tone="mean"
        items={value.means}
        onChange={(means) => update((prev) => ({ ...prev, means }))}
      />

      <p className="text-center text-xs text-slate-400 font-medium">
        ¿Aún no defines el problema?{' '}
        <Link href="/arbol-problema" className="text-[#FF8F1C] font-bold hover:underline">
          Ve al Árbol del Problema
        </Link>
      </p>
    </div>
  );
};

export default function ArbolSolucionesPage() {
  return (
    <CostosShell
      title="Árbol de"
      highlight="Soluciones"
      subtitle="Define el objetivo de tu proyecto, los medios para lograrlo y los fines que alcanzarás."
      tabs={PLASMANDO_TABS}
      navLabel="Plasmando la Idea"
    >
      {({ ownerId }) => <SolutionTreeEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
