'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import {
  calcIngredientCost,
  formatMoney,
  getCompatibleUnits,
  getUnit,
} from '@/lib/units';

export type IngredientType = 'material' | 'empaque' | 'etiqueta';

export interface CatalogItem {
  id: string;
  type: IngredientType;
  name: string;
  unit: string;
  costPerUnit: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  yieldQty: number;
  fixedCostUnit: number;
  profitUnit: number;
  taxUnit: number;
}

interface Ingredient {
  id: string;
  type: IngredientType;
  itemId: string;
  quantity: number;
  unit: string;
}

interface RecipeEditorProps {
  product: ProductSummary;
  catalog: CatalogItem[];
}

const TYPE_LABEL: Record<IngredientType, string> = {
  material: 'Material',
  empaque: 'Empaque',
  etiqueta: 'Etiqueta',
};

const MAX_VISIBLE_MATERIALS = 7;
const MATERIAL_ROW_HEIGHT = 64;

const RecipeEditor: React.FC<RecipeEditorProps> = ({ product, catalog }) => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<IngredientType>('material');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('producto_ingredientes')
      .select('*')
      .eq('producto_id', product.id)
      .order('fecha', { ascending: true });
    if (error) {
      setErrorMsg(error.message);
      setIngredients([]);
    } else {
      setIngredients(
        (data ?? []).map((r) => ({
          id: r.id,
          type: r.tipo,
          itemId: r.item_id,
          quantity: Number(r.cantidad) || 0,
          unit: r.unidad ?? 'und',
        }))
      );
    }
    setLoading(false);
  }, [product.id]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const itemsOfType = useMemo(() => catalog.filter((c) => c.type === type), [catalog, type]);
  const usedItemIds = useMemo(() => new Set(ingredients.map((i) => i.itemId)), [ingredients]);
  const usedTypes = useMemo(() => new Set(ingredients.map((i) => i.type)), [ingredients]);
  const typeLocked = type !== 'material' && usedTypes.has(type);
  const availableItems = useMemo(
    () => (typeLocked ? [] : itemsOfType.filter((c) => !usedItemIds.has(c.id))),
    [itemsOfType, usedItemIds, typeLocked]
  );
  const selectedItem = useMemo(() => catalog.find((c) => c.id === itemId), [catalog, itemId]);
  const showUnitField = type === 'material';
  const unitOptions = useMemo(
    () => (selectedItem ? getCompatibleUnits(selectedItem.unit) : []),
    [selectedItem]
  );

  const getSmallestUnit = (purchaseUnit: string): string => {
    const options = getCompatibleUnits(purchaseUnit);
    if (options.length === 0) return purchaseUnit;
    return options.reduce((min, u) => (u.toBase < min.toBase ? u : min), options[0]).value;
  };

  const handleSelectItem = (id: string) => {
    setItemId(id);
    const item = catalog.find((c) => c.id === id);
    if (!item) {
      setUnit('');
      return;
    }
    setUnit(item.type === 'material' ? getSmallestUnit(item.unit) : 'und');
  };

  const handleChangeType = (t: IngredientType) => {
    setType(t);
    setItemId('');
    setUnit('');
  };

  const lineCost = useCallback(
    (ing: Ingredient): number => {
      const item = catalog.find((c) => c.id === ing.itemId);
      if (!item) return 0;
      return calcIngredientCost(item.costPerUnit, item.unit, ing.quantity, ing.unit);
    },
    [catalog]
  );

  const batchCost = useMemo(
    () => ingredients.reduce((acc, ing) => acc + lineCost(ing), 0),
    [ingredients, lineCost]
  );
  const yieldNumber = product.yieldQty > 0 ? product.yieldQty : 1;
  const variableCostUnit = batchCost / yieldNumber;

  const materialIngredients = useMemo(
    () => ingredients.filter((i) => i.type === 'material'),
    [ingredients]
  );
  const packagingIngredients = useMemo(
    () => ingredients.filter((i) => i.type !== 'material'),
    [ingredients]
  );

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qty) || 0;
    const finalUnit = showUnitField ? unit : 'und';
    if (!itemId || !finalUnit || q <= 0) {
      setErrorMsg('Nombre, cantidad y unidad son obligatorios.');
      return;
    }
    if (usedItemIds.has(itemId)) {
      setErrorMsg('Este elemento ya fue agregado a este producto.');
      return;
    }
    if (type !== 'material' && usedTypes.has(type)) {
      setErrorMsg(
        type === 'empaque' ?'Solo se permite un empaque por producto.' :'Solo se permite una etiqueta por producto.'
      );
      return;
    }
    if (!user?.email) {
      setErrorMsg('Inicia sesión para guardar ingredientes.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    const { error } = await supabase.from('producto_ingredientes').insert({
      owner_id: user.id,
      producto_id: product.id,
      usuario: user.email,
      tipo: type,
      item_id: itemId,
      cantidad: q,
      unidad: finalUnit,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setItemId('');
      setQty('');
      setUnit('');
      await loadIngredients();
    }
    setSaving(false);
  };

  const handleDeleteIngredient = async (id: string) => {
    setErrorMsg('');
    const { error } = await supabase.from('producto_ingredientes').delete().eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const renderIngredientRow = (ing: Ingredient) => {
    const item = catalog.find((c) => c.id === ing.itemId);
    return (
      <li
        key={ing.id}
        className="flex items-center gap-3 px-4 bg-[#0B2540]/50"
        style={{ minHeight: `${MATERIAL_ROW_HEIGHT}px` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">
            {item?.name ?? 'Ingrediente eliminado'}
          </p>
          <p className="text-slate-400 text-xs">
            {TYPE_LABEL[ing.type]} · {ing.quantity} {getUnit(ing.unit).label}
          </p>
        </div>
        <span className="text-[#FF8F1C] text-sm font-extrabold whitespace-nowrap">
          {formatMoney(lineCost(ing))}
        </span>
        <button
          type="button"
          onClick={() => handleDeleteIngredient(ing.id)}
          aria-label="Eliminar ingrediente"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Icon name="TrashIcon" size={16} />
        </button>
      </li>
    );
  };

  const inputClass =
    'w-full rounded-xl bg-[#071628] border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8F1C]';

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAddIngredient}
        className="rounded-2xl border border-white/10 bg-[#071628]/60 p-4 space-y-3"
      >
        <p className="text-white text-sm font-extrabold">Agregar ingrediente</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select
            value={type}
            onChange={(e) => handleChangeType(e.target.value as IngredientType)}
            aria-label="Tipo de ingrediente"
            className={inputClass}
          >
            <option value="material">Material</option>
            <option value="empaque">Empaque</option>
            <option value="etiqueta">Etiqueta</option>
          </select>
          <select
            value={itemId}
            onChange={(e) => handleSelectItem(e.target.value)}
            aria-label="Ingrediente"
            className={`${inputClass} ${showUnitField ? 'sm:col-span-2' : 'sm:col-span-3'}`}
            required
          >
            <option value="">
              {typeLocked
                ? type === 'empaque' ?'Ya agregaste un empaque' :'Ya agregaste una etiqueta'
                : availableItems.length === 0
                  ? 'Sin registros disponibles' :'Selecciona...'}
            </option>
            {availableItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({formatMoney(c.costPerUnit)} / {getUnit(c.unit).label})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Cantidad"
            aria-label="Cantidad usada"
            className={inputClass}
            required
          />
          {showUnitField && (
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Unidad usada"
              className={inputClass}
              disabled={!selectedItem}
              required
            >
              {!selectedItem && <option value="">Unidad</option>}
              {unitOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !itemId}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-[#030C16] bg-[#FF8F1C] hover:bg-[#ffa13f] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Icon name="PlusIcon" size={16} />
          <span>Agregar a la receta</span>
        </button>
      </form>

      {errorMsg && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-2.5 bg-[#071628]/70 border-b border-white/5">
          <p className="text-white text-xs font-extrabold uppercase tracking-wide">Materiales</p>
        </div>
        <ul
          className="divide-y divide-white/5 overflow-y-auto"
          style={{ maxHeight: `${MAX_VISIBLE_MATERIALS * MATERIAL_ROW_HEIGHT}px` }}
        >
          {loading && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">Cargando...</li>
          )}
          {!loading && materialIngredients.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              Esta receta aún no tiene materiales.
            </li>
          )}
          {!loading && materialIngredients?.map((ing) => renderIngredientRow(ing))}
        </ul>
        {materialIngredients.length > MAX_VISIBLE_MATERIALS && (
          <p className="px-4 py-1.5 text-[11px] text-slate-400 bg-[#071628]/50 border-t border-white/5">
            Mostrando {MAX_VISIBLE_MATERIALS} de {materialIngredients.length}. Desplázate para ver
            el resto.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#FF8F1C]/30 overflow-hidden">
        <div className="px-4 py-2.5 bg-[#071628]/70 border-b border-white/5">
          <p className="text-[#FF8F1C] text-xs font-extrabold uppercase tracking-wide">
            Empaques y etiquetas
          </p>
        </div>
        <ul className="divide-y divide-white/5">
          {!loading && packagingIngredients.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              Aún no has agregado empaques ni etiquetas.
            </li>
          )}
          {!loading && packagingIngredients?.map((ing) => renderIngredientRow(ing))}
        </ul>
      </div>

      <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-[#FF8F1C]/50 bg-[#FF8F1C]/10">
        <span className="text-[#FF8F1C] text-xs font-extrabold uppercase tracking-wide">
          Costo Variable Unitario
        </span>
        <span className="text-[#FF8F1C] text-lg font-black">{formatMoney(variableCostUnit)}</span>
      </div>
    </div>
  );
};

export default RecipeEditor;
