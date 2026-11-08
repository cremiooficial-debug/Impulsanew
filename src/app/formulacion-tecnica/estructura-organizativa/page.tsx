'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import {
  DEDICATION_LABELS,
  EMPTY_ESTRUCTURA,
  TECNICA_TABS,
  newId,
  toNumber,
  useTecnicaDraft,
  type Dedication,
  type EstructuraOrganizativa,
  type RoleItem,
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

const MAX_ROLES = 15;

const DEDICATION_STYLES: Record<Dedication, string> = {
  'tiempo-completo': 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
  'tiempo-parcial': 'text-sky-300 bg-sky-400/10 border-sky-400/30',
  destajo: 'text-[#FF8F1C] bg-[#FF8F1C]/10 border-[#FF8F1C]/30',
};

const EstructuraEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<EstructuraOrganizativa>(
    ownerId,
    'estructura-organizativa',
    EMPTY_ESTRUCTURA
  );
  const roles: RoleItem[] = Array.isArray(value.roles) ? value.roles : [];

  const setRole = (id: string, patch: Partial<RoleItem>) =>
    update((prev) => ({
      ...prev,
      roles: (prev.roles ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const addRole = () =>
    update((prev) => ({
      ...prev,
      roles: [
        ...(prev.roles ?? []),
        {
          id: newId(),
          title: '',
          reportsTo: '',
          functions: '',
          profile: '',
          dedication: 'tiempo-completo',
          hours: '',
          count: '1',
        },
      ],
    }));

  const removeRole = (id: string) =>
    update((prev) => ({
      ...prev,
      roles: (prev.roles ?? []).filter((r) => r.id !== id).map((r) =>
        r.reportsTo === id ? { ...r, reportsTo: '' } : r
      ),
    }));

  const totalPeople = roles.reduce((sum, r) => sum + Math.max(toNumber(r.count), 0), 0);
  const fullTime = roles
    .filter((r) => r.dedication === 'tiempo-completo')
    .reduce((sum, r) => sum + Math.max(toNumber(r.count), 0), 0);
  const weeklyHours = roles.reduce((sum, r) => {
    const count = Math.max(toNumber(r.count), 0);
    const hours = r.dedication === 'tiempo-completo' ? 40 : toNumber(r.hours);
    return sum + count * hours;
  }, 0);

  const rootRoles = roles.filter((r) => !r.reportsTo || !roles.some((o) => o.id === r.reportsTo));
  const childrenOf = (id: string) => roles.filter((r) => r.reportsTo === id);

  const renderNode = (role: RoleItem, depth: number, trail: string[]): React.ReactNode => {
    if (trail.includes(role.id) || depth > 6) return null;
    const kids = childrenOf(role.id);
    return (
      <li key={role.id} className="flex flex-col items-center">
        <div className="rounded-2xl bg-[#071628]/90 border border-[#FF8F1C]/40 px-3 py-2 text-center min-w-[120px] max-w-[180px]">
          <p className="text-white text-xs font-extrabold leading-tight break-words">
            {role.title || 'Sin nombre'}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            {toNumber(role.count) || 1} · {DEDICATION_LABELS[role.dedication]}
          </p>
        </div>
        {kids.length > 0 && (
          <>
            <span className="w-px h-4 bg-white/25" aria-hidden="true" />
            <ul className="flex flex-wrap justify-center gap-3 pt-0 border-t border-white/25">
              {kids.map((k) => renderNode(k, depth + 1, [...trail, role.id]))}
            </ul>
          </>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Define los roles clave de tu proyecto, quién responde a quién, el perfil que necesitas y cuánto tiempo requiere cada puesto."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Roles definidos" value={String(roles.length)} accent="#38BDF8" />
        <Stat label="Personas requeridas" value={String(totalPeople)} accent="#FF8F1C" />
        <Stat
          label="Horas semanales totales"
          value={`${Math.round(weeklyHours)} h`}
          accent="#34D399"
        />
      </div>

      <SectionCard
        title="Organigrama operativo"
        hint="Se construye solo a partir de los roles y de a quién reporta cada uno."
        accent="#FF8F1C"
      >
        {roles.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-1">
            Agrega roles para ver el organigrama.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-[#071628]/60 border border-white/10 p-4">
            <ul className="flex flex-wrap justify-center gap-4 min-w-max mx-auto">
              {rootRoles.map((r) => renderNode(r, 0, []))}
            </ul>
          </div>
        )}
        {fullTime > 0 && (
          <p className="text-slate-400 text-xs font-medium mt-3">
            {fullTime} {fullTime === 1 ? 'persona' : 'personas'} a tiempo completo (40 h/semana
            cada una).
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Roles y perfiles de puesto"
        hint="Funciones clave, perfil requerido y carga laboral."
        accent="#38BDF8"
        action={
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border text-sky-300 bg-sky-400/10 border-sky-400/30">
            {roles.length}/{MAX_ROLES}
          </span>
        }
      >
        {roles.length > 0 && (
          <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {roles.map((role, index) => (
              <li key={role.id} className={ITEM_BOX}>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${DEDICATION_STYLES[role.dedication]}`}
                  >
                    {DEDICATION_LABELS[role.dedication]}
                  </span>
                  <RemoveButton
                    label={`Eliminar rol ${index + 1}`}
                    onClick={() => removeRole(role.id)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field
                    label="Cargo"
                    value={role.title}
                    onChange={(t) => setRole(role.id, { title: t })}
                    placeholder="Ej: Jefe de producción"
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">
                      Reporta a
                    </span>
                    <select
                      value={role.reportsTo}
                      onChange={(e) => setRole(role.id, { reportsTo: e.target.value })}
                      className="w-full rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white font-medium outline-none transition-colors"
                    >
                      <option value="" className="bg-[#071628]">
                        Nadie (nivel superior)
                      </option>
                      {roles
                        .filter((o) => o.id !== role.id)
                        .map((o) => (
                          <option key={o.id} value={o.id} className="bg-[#071628]">
                            {o.title || 'Sin nombre'}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <Field
                    label="Funciones clave"
                    value={role.functions}
                    onChange={(t) => setRole(role.id, { functions: t })}
                    placeholder="Qué hace este puesto"
                    rows={3}
                  />
                  <Field
                    label="Perfil requerido"
                    value={role.profile}
                    onChange={(t) => setRole(role.id, { profile: t })}
                    placeholder="Formación, experiencia, habilidades"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <label className="flex flex-col gap-1 col-span-3 sm:col-span-1">
                    <span className="text-[11px] font-bold text-[#FF8F1C] uppercase tracking-wide">
                      Dedicación
                    </span>
                    <select
                      value={role.dedication}
                      onChange={(e) =>
                        setRole(role.id, { dedication: e.target.value as Dedication })
                      }
                      className="w-full rounded-xl bg-[#030C16]/60 border border-white/10 focus:border-[#FF8F1C]/70 px-2.5 py-2 text-sm text-white font-medium outline-none transition-colors"
                    >
                      {(Object.keys(DEDICATION_LABELS) as Dedication[]).map((d) => (
                        <option key={d} value={d} className="bg-[#071628]">
                          {DEDICATION_LABELS[d]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Personas"
                    type="number"
                    value={role.count}
                    onChange={(t) => setRole(role.id, { count: t })}
                    placeholder="1"
                  />
                  <Field
                    label={role.dedication === 'destajo' ? 'Horas / semana estimadas' : 'Horas / semana'}
                    type="number"
                    value={role.dedication === 'tiempo-completo' ? '40' : role.hours}
                    onChange={(t) => setRole(role.id, { hours: t })}
                    placeholder="20"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className={roles.length > 0 ? 'mt-4' : ''}>
          <AddButton label="Agregar rol" onClick={addRole} disabled={roles.length >= MAX_ROLES} />
        </div>
      </SectionCard>
    </div>
  );
};

export default function EstructuraOrganizativaPage() {
  return (
    <CostosShell
      title="Estructura"
      highlight="Organizativa"
      subtitle="Define los roles, perfiles y la carga laboral de tu equipo."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <EstructuraEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
