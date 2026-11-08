'use client';

import React from 'react';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import {
  EMPTY_ACTIVOS,
  TECNICA_TABS,
  newId,
  toNumber,
  useTecnicaDraft,
  type ActivosRequeridos,
  type AssetCategory,
  type AssetItem,
  type SupplierItem,
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

const MAX_ASSETS = 30;
const MAX_SUPPLIERS = 15;

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: 'maquinaria', label: 'Maquinaria' },
  { key: 'herramientas', label: 'Herramientas' },
  { key: 'tecnologia', label: 'Equipos tecnológicos' },
  { key: 'mobiliario', label: 'Mobiliario' },
];

const formatMoney = (n: number): string =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatInt = (n: number): string => Math.round(n).toLocaleString('es-VE');

const ActivosEditor: React.FC<{ ownerId: string }> = ({ ownerId }) => {
  const { value, update, savedAt, saveError } = useTecnicaDraft<ActivosRequeridos>(
    ownerId,
    'activos-requeridos',
    EMPTY_ACTIVOS
  );
  const assets: AssetItem[] = Array.isArray(value.activos) ? value.activos : [];
  const suppliers: SupplierItem[] = Array.isArray(value.proveedores) ? value.proveedores : [];

  const setAsset = (id: string, field: keyof Omit<AssetItem, 'id'>, text: string) =>
    update((prev) => ({
      ...prev,
      activos: (prev.activos ?? []).map((a) => (a.id === id ? { ...a, [field]: text } : a)),
    }));

  const addAsset = (category: AssetCategory) =>
    update((prev) => ({
      ...prev,
      activos: [
        ...(prev.activos ?? []),
        { id: newId(), category, name: '', quantity: '1', unitCost: '' },
      ],
    }));

  const removeAsset = (id: string) =>
    update((prev) => ({ ...prev, activos: (prev.activos ?? []).filter((a) => a.id !== id) }));

  const setSupplier = (id: string, field: keyof Omit<SupplierItem, 'id'>, text: string) =>
    update((prev) => ({
      ...prev,
      proveedores: (prev.proveedores ?? []).map((s) => (s.id === id ? { ...s, [field]: text } : s)),
    }));

  const addSupplier = () =>
    update((prev) => ({
      ...prev,
      proveedores: [...(prev.proveedores ?? []), { id: newId(), name: '', supplies: '', contact: '' }],
    }));

  const removeSupplier = (id: string) =>
    update((prev) => ({
      ...prev,
      proveedores: (prev.proveedores ?? []).filter((s) => s.id !== id),
    }));

  const setField = (field: keyof ActivosRequeridos, text: string) =>
    update((prev) => ({ ...prev, [field]: text }));

  const totalInvestment = assets.reduce(
    (sum, a) => sum + toNumber(a.quantity) * toNumber(a.unitCost),
    0
  );
  const efficiency = Math.min(Math.max(toNumber(value.eficiencia), 0), 100) / 100;
  const perDay = toNumber(value.capacidadPorHora) * toNumber(value.horasPorDia) * efficiency;
  const perMonth = perDay * toNumber(value.diasPorMes);

  return (
    <div className="flex flex-col gap-5">
      <SaveStatus
        savedAt={savedAt}
        saveError={saveError}
        intro="Lista lo que necesitas para operar, quiénes te lo suministran y cuánto podrás producir o atender con esa capacidad instalada."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Activos registrados" value={String(assets.length)} accent="#38BDF8" />
        <Stat label="Inversión estimada" value={formatMoney(totalInvestment)} accent="#FF8F1C" />
        <Stat
          label={`Capacidad mensual${value.capacidadUnidad ? ` (${value.capacidadUnidad})` : ''}`}
          value={formatInt(perMonth)}
          accent="#34D399"
        />
      </div>

      {CATEGORIES.map((cat) => {
        const list = assets.filter((a) => a.category === cat.key);
        return (
          <SectionCard
            key={cat.key}
            title={cat.label}
            hint="Nombre, cantidad y costo unitario de cada elemento."
            accent="#FF8F1C"
          >
            {list.length === 0 ? (
              <p className="text-slate-400 text-sm font-medium py-1">Aún no hay elementos.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {list.map((asset) => (
                  <li key={asset.id} className={ITEM_BOX}>
                    <div className="grid grid-cols-2 md:grid-cols-[1fr_110px_140px_auto] gap-2 items-end">
                      <Field
                        label="Nombre"
                        value={asset.name}
                        onChange={(t) => setAsset(asset.id, 'name', t)}
                        placeholder="Ej: Horno industrial"
                        className="col-span-2 md:col-span-1"
                      />
                      <Field
                        label="Cantidad"
                        type="number"
                        value={asset.quantity}
                        onChange={(t) => setAsset(asset.id, 'quantity', t)}
                        placeholder="1"
                      />
                      <Field
                        label="Costo unitario"
                        type="number"
                        value={asset.unitCost}
                        onChange={(t) => setAsset(asset.id, 'unitCost', t)}
                        placeholder="0.00"
                      />
                      <div className="flex items-center justify-end gap-3 pb-2">
                        <span className="text-sm font-bold text-slate-200">
                          {formatMoney(toNumber(asset.quantity) * toNumber(asset.unitCost))}
                        </span>
                        <RemoveButton
                          label={`Eliminar ${asset.name || 'elemento'}`}
                          onClick={() => removeAsset(asset.id)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <AddButton
                label={`Agregar ${cat.label.toLowerCase()}`}
                onClick={() => addAsset(cat.key)}
                disabled={assets.length >= MAX_ASSETS}
              />
            </div>
          </SectionCard>
        );
      })}

      <SectionCard
        title="Proveedores clave, materias primas y licencias"
        hint="Quién te suministra lo esencial y cómo contactarlo."
        accent="#A78BFA"
      >
        {suppliers.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-1">Aún no hay proveedores.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suppliers.map((s, index) => (
              <li key={s.id} className={ITEM_BOX}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Proveedor {index + 1}
                  </span>
                  <RemoveButton
                    label={`Eliminar proveedor ${index + 1}`}
                    onClick={() => removeSupplier(s.id)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Field
                    label="Proveedor"
                    value={s.name}
                    onChange={(t) => setSupplier(s.id, 'name', t)}
                    placeholder="Ej: Distribuidora Los Andes"
                  />
                  <Field
                    label="Qué suministra"
                    value={s.supplies}
                    onChange={(t) => setSupplier(s.id, 'supplies', t)}
                    placeholder="Ej: Harina, azúcar, licencia de software contable"
                  />
                  <Field
                    label="Contacto"
                    value={s.contact}
                    onChange={(t) => setSupplier(s.id, 'contact', t)}
                    placeholder="Teléfono o correo"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <AddButton
            label="Agregar proveedor"
            onClick={addSupplier}
            disabled={suppliers.length >= MAX_SUPPLIERS}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Capacidad instalada"
        hint="Cuánto puedes producir o atender en un periodo dado."
        accent="#34D399"
      >
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Field
            label="Unidad"
            value={value.capacidadUnidad}
            onChange={(t) => setField('capacidadUnidad', t)}
            placeholder="Ej: frascos, clientes"
          />
          <Field
            label="Capacidad por hora"
            type="number"
            value={value.capacidadPorHora}
            onChange={(t) => setField('capacidadPorHora', t)}
            placeholder="0"
          />
          <Field
            label="Horas por día"
            type="number"
            value={value.horasPorDia}
            onChange={(t) => setField('horasPorDia', t)}
            placeholder="8"
          />
          <Field
            label="Días por mes"
            type="number"
            value={value.diasPorMes}
            onChange={(t) => setField('diasPorMes', t)}
            placeholder="22"
          />
          <Field
            label="Eficiencia (%)"
            type="number"
            value={value.eficiencia}
            onChange={(t) => setField('eficiencia', t)}
            placeholder="85"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Stat label="Capacidad diaria" value={formatInt(perDay)} accent="#38BDF8" />
          <Stat label="Capacidad mensual" value={formatInt(perMonth)} accent="#34D399" />
        </div>
      </SectionCard>
    </div>
  );
};

export default function ActivosRequeridosPage() {
  return (
    <CostosShell
      title="Activos"
      highlight="Requeridos"
      subtitle="Define los recursos que necesitas y la capacidad de tu emprendimiento."
      tabs={TECNICA_TABS}
      navLabel="Formulación Técnica"
    >
      {({ ownerId }) => <ActivosEditor ownerId={ownerId} />}
    </CostosShell>
  );
}
