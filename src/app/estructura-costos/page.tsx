'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CostosShell from '@/app/costos-variables/components/CostosShell';
import { calcIngredientCost, formatMoney } from '@/lib/units';

interface EstructuraContentProps {
  usuario: string;
  ownerId: string;
}

interface ProductRow {
  id: string;
  name: string;
  variableCostUnit: number;
  production: string;
  profitPct: string;
  taxPct: string;
}

const toNumber = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const formatUnits = (value: number): string => {
  if (!Number.isFinite(value)) return '—';
  return (Math.round(value * 100) / 100).toString();
};

const EstructuraContent: React.FC<EstructuraContentProps> = ({ usuario, ownerId }) => {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [totalFixed, setTotalFixed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    const [prod, ing, mat, emp, eti, per, equ, ser, est] = await Promise.all([
      supabase
        .from('productos_receta')
        .select('*')
        .eq('owner_id', ownerId)
        .order('fecha', { ascending: true }),
      supabase.from('producto_ingredientes').select('*').eq('owner_id', ownerId),
      supabase.from('materiales').select('*').eq('owner_id', ownerId),
      supabase.from('empaques').select('*').eq('owner_id', ownerId),
      supabase.from('etiquetas').select('*').eq('owner_id', ownerId),
      supabase.from('costos_fijos_personal').select('costo_mensual').eq('owner_id', ownerId),
      supabase.from('costos_fijos_equipos').select('costo_mensual').eq('owner_id', ownerId),
      supabase.from('costos_fijos_servicios').select('costo_mensual').eq('owner_id', ownerId),
      supabase.from('estructura_costos_productos').select('*').eq('owner_id', ownerId),
    ]);

    const firstError =
      prod.error ?? ing.error ?? mat.error ?? emp.error ?? eti.error ?? per.error ?? equ.error ?? ser.error ?? est.error;
    if (firstError) setErrorMsg(firstError.message);

    const catalog = new Map<string, { unit: string; costPerUnit: number }>();
    const addCatalog = (
      list: { id: string; unidad: string; cantidad_comprada: number; precio_compra: number }[] | null,
      storedCosts: Map<string, number>
    ) => {
      (list ?? []).forEach((r) => {
        const qty = Number(r.cantidad_comprada) || 0;
        const price = Number(r.precio_compra) || 0;
        catalog.set(r.id, {
          unit: r.unidad || 'und',
          costPerUnit: qty > 0 ? price / qty : (storedCosts.get(r.id) ?? 0),
        });
      });
    };
    addCatalog(
      mat.data,
      new Map((mat.data ?? []).map((r) => [r.id, Number(r.costo_unitario) || 0]))
    );
    addCatalog(emp.data, new Map((emp.data ?? []).map((r) => [r.id, Number(r.costo) || 0])));
    addCatalog(eti.data, new Map((eti.data ?? []).map((r) => [r.id, Number(r.costo) || 0])));

    const batchCostByProduct = new Map<string, number>();
    (ing.data ?? []).forEach((r) => {
      const item = catalog.get(r.item_id);
      if (!item) return;
      const cost = calcIngredientCost(
        item.costPerUnit,
        item.unit,
        Number(r.cantidad) || 0,
        r.unidad ?? 'und'
      );
      batchCostByProduct.set(r.producto_id, (batchCostByProduct.get(r.producto_id) ?? 0) + cost);
    });

    const saved = new Map((est.data ?? []).map((r) => [r.producto_id, r]));

    setRows(
      (prod.data ?? []).map((p) => {
        const yieldQty = Number(p.rendimiento) > 0 ? Number(p.rendimiento) : 1;
        const s = saved.get(p.id);
        return {
          id: p.id,
          name: p.nombre,
          variableCostUnit: (batchCostByProduct.get(p.id) ?? 0) / yieldQty,
          production: s ? String(Number(s.produccion_mensual) || 0) : '',
          profitPct: s ? String(Number(s.porcentaje_ganancia) || 0) : '',
          taxPct: s ? String(Number(s.porcentaje_impuesto)) : '16',
        };
      })
    );

    const sum = (list: { costo_mensual: number }[] | null) =>
      (list ?? []).reduce((acc, r) => acc + (Number(r.costo_mensual) || 0), 0);
    setTotalFixed(sum(per.data) + sum(equ.data) + sum(ser.data));
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateRow = (id: string, field: 'production' | 'profitPct' | 'taxPct', value: string) => {
    setSavedMsg('');
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const computed = useMemo(() => {
    const weights = rows.map((r) => r.variableCostUnit * toNumber(r.production));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const lines = rows.map((r, i) => {
      const production = toNumber(r.production);
      const fixedAssigned = totalWeight > 0 ? (totalFixed * weights[i]) / totalWeight : 0;
      const fixedUnit = production > 0 ? fixedAssigned / production : 0;
      const profitUnit = (r.variableCostUnit + fixedUnit) * (toNumber(r.profitPct) / 100);
      const taxUnit = (r.variableCostUnit + fixedUnit + profitUnit) * (toNumber(r.taxPct) / 100);
      const margin = fixedUnit + profitUnit;
      return { production, fixedAssigned, margin, fixedUnit, profitUnit, taxUnit };
    });

    const mixMargin = lines.reduce((acc, l) => acc + l.production * l.margin, 0);
    const k = mixMargin > 0 ? totalFixed / mixMargin : 0;

    return lines.map((l, i) => ({
      fixedAssigned: l.fixedAssigned,
      breakEven: k > 0 ? l.production * k : null,
      fixedUnit: l.fixedUnit,
      profitUnit: l.profitUnit,
      taxUnit: l.taxUnit,
      pvp: rows[i].variableCostUnit + l.fixedUnit + l.profitUnit + l.taxUnit,
    }));
  }, [rows, totalFixed]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSavedMsg('');
    const payload = rows.map((r) => ({
      owner_id: ownerId,
      producto_id: r.id,
      usuario,
      produccion_mensual: toNumber(r.production),
      porcentaje_ganancia: toNumber(r.profitPct),
      porcentaje_impuesto: toNumber(r.taxPct),
    }));
    const { error } = await supabase
      .from('estructura_costos_productos')
      .upsert(payload, { onConflict: 'producto_id' });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSavedMsg('Datos guardados correctamente.');
    }
    setSaving(false);
  };

  const inputClass =
    'w-28 rounded-xl bg-[#071628] border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8F1C]';

  return (
    <div className="space-y-6">
      <section
        className="rounded-3xl bg-[#0B2540]/75 backdrop-blur-md shadow-xl border border-white/10 overflow-hidden"
        aria-label="Tabla de estructura de costos"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-extrabold text-base sm:text-lg">Estructura de costos</h2>
            <p className="text-slate-400 text-xs font-medium">
              Costos fijos mensuales totales:{' '}
              <span className="text-[#FF8F1C] font-extrabold">{formatMoney(totalFixed)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || rows.length === 0}
            className="rounded-full px-4 py-2 text-xs font-bold text-[#030C16] bg-[#FF8F1C] hover:bg-[#ffa13f] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
            {errorMsg}
          </div>
        )}
        {savedMsg && (
          <div className="mx-5 mt-4 rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-300">
            {savedMsg}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="bg-[#071628]/70 text-[11px] font-extrabold uppercase tracking-wide text-slate-300">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Producción mensual</th>
                <th className="px-4 py-3">Costos fijos asignados</th>
                <th className="px-4 py-3">% Ganancia</th>
                <th className="px-4 py-3">% Impuestos</th>
                <th className="px-4 py-3">Punto de equilibrio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Aún no tienes productos registrados.
                  </td>
                </tr>
              )}
              {!loading &&
                rows?.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-white text-sm font-bold">{r.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={r.production}
                        onChange={(e) => updateRow(r.id, 'production', e.target.value)}
                        aria-label={`Producción mensual de ${r.name}`}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-bold">
                      {formatMoney(computed[i]?.fixedAssigned ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={r.profitPct}
                        onChange={(e) => updateRow(r.id, 'profitPct', e.target.value)}
                        aria-label={`Porcentaje de ganancia de ${r.name}`}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={r.taxPct}
                        onChange={(e) => updateRow(r.id, 'taxPct', e.target.value)}
                        aria-label={`Porcentaje de impuestos de ${r.name}`}
                        placeholder="16"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3 text-[#FF8F1C] text-sm font-extrabold">
                      {computed[i]?.breakEven != null
                        ? `${formatUnits(computed[i].breakEven as number)} und`
                        : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-3xl bg-[#0B2540]/75 backdrop-blur-md shadow-xl border border-white/10 overflow-hidden"
        aria-label="Desglose de precio"
      >
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-extrabold text-base sm:text-lg">Desglose de precio</h2>
          <p className="text-slate-400 text-xs font-medium">
            PVP = CVU + CFU + GAN + IMP (valores por unidad)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-[#071628]/70 text-[11px] font-extrabold uppercase tracking-wide text-slate-300">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">CVU</th>
                <th className="px-4 py-3">CFU</th>
                <th className="px-4 py-3">GAN</th>
                <th className="px-4 py-3">IMP</th>
                <th className="px-4 py-3">PVP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Aún no tienes productos registrados.
                  </td>
                </tr>
              )}
              {!loading &&
                rows?.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-white text-sm font-bold">{r.name}</td>
                    <td className="px-4 py-3 text-white text-sm font-bold">
                      {formatMoney(r.variableCostUnit)}
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-bold">
                      {formatMoney(computed[i]?.fixedUnit ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-bold">
                      {formatMoney(computed[i]?.profitUnit ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-bold">
                      {formatMoney(computed[i]?.taxUnit ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-[#FF8F1C] text-sm font-extrabold">
                      {formatMoney(computed[i]?.pvp ?? 0)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default function EstructuraCostosPage() {
  return (
    <CostosShell
      title="Estructura de"
      highlight="costos"
      subtitle="Distribuye tus costos fijos entre tus productos y calcula tu punto de equilibrio."
    >
      {({ usuario, ownerId }) => <EstructuraContent usuario={usuario} ownerId={ownerId} />}
    </CostosShell>
  );
}
