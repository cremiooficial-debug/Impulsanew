'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavTab } from '@/app/costos-variables/components/CostosShell';
import { createClient } from '@/lib/supabase/client';

export type TecnicaPage =
  | 'ficha-tecnica' |'mapa-procesos' |'activos-requeridos' |'distribucion-planta' |'estructura-organizativa' |'cronograma-implementacion';

export const TECNICA_TABS: NavTab[] = [
  { label: 'Ficha Técnica', href: '/formulacion-tecnica/ficha-tecnica', icon: 'ClipboardDocumentListIcon' },
  { label: 'Mapa de Procesos', href: '/formulacion-tecnica/mapa-procesos', icon: 'ArrowPathIcon' },
  { label: 'Activos Requeridos', href: '/formulacion-tecnica/activos-requeridos', icon: 'WrenchScrewdriverIcon' },
  { label: 'Distribución en Planta', href: '/formulacion-tecnica/distribucion-planta', icon: 'Squares2X2Icon' },
  { label: 'Estructura Organizativa', href: '/formulacion-tecnica/estructura-organizativa', icon: 'UserGroupIcon' },
  { label: 'Cronograma', href: '/formulacion-tecnica/cronograma-implementacion', icon: 'CalendarDaysIcon' },
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------ Ficha Técnica ------------------------------ */

export interface SpecItem {
  id: string;
  name: string;
  detail: string;
}

export interface FichaTecnica {
  descripcion: string;
  caracteristicas: SpecItem[];
  diseno: string;
  materiales: string;
  tecnologia: string;
  diagramas: string;
}

export const EMPTY_FICHA: FichaTecnica = {
  descripcion: '',
  caracteristicas: [],
  diseno: '',
  materiales: '',
  tecnologia: '',
  diagramas: '',
};

/* ----------------------------- Mapa de Procesos ---------------------------- */

export type ProcessType = 'estrategico' | 'principal' | 'apoyo';

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  responsable: string;
}

export interface MapaProcesos {
  entrada: string;
  salida: string;
  pasos: ProcessStep[];
  estrategicos: string[];
  principales: string[];
  apoyo: string[];
}

export const EMPTY_MAPA: MapaProcesos = {
  entrada: '',
  salida: '',
  pasos: [],
  estrategicos: [],
  principales: [],
  apoyo: [],
};

/* ---------------------------- Activos Requeridos --------------------------- */

export type AssetCategory = 'maquinaria' | 'herramientas' | 'tecnologia' | 'mobiliario';

export interface AssetItem {
  id: string;
  category: AssetCategory;
  name: string;
  quantity: string;
  unitCost: string;
}

export interface SupplierItem {
  id: string;
  name: string;
  supplies: string;
  contact: string;
}

export interface ActivosRequeridos {
  activos: AssetItem[];
  proveedores: SupplierItem[];
  capacidadUnidad: string;
  capacidadPorHora: string;
  horasPorDia: string;
  diasPorMes: string;
  eficiencia: string;
}

export const EMPTY_ACTIVOS: ActivosRequeridos = {
  activos: [],
  proveedores: [],
  capacidadUnidad: '',
  capacidadPorHora: '',
  horasPorDia: '',
  diasPorMes: '',
  eficiencia: '85',
};

/* --------------------------- Distribución en Planta ------------------------ */

export interface PlantZone {
  id: string;
  name: string;
  area: string;
  color: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface DistribucionPlanta {
  areaTotal: string;
  zonas: PlantZone[];
  flujo: string;
  mejoras: string;
}

export const EMPTY_DISTRIBUCION: DistribucionPlanta = {
  areaTotal: '',
  zonas: [],
  flujo: '',
  mejoras: '',
};

export const ZONE_COLORS: string[] = ['#FF8F1C', '#38BDF8', '#34D399', '#A78BFA', '#F472B6', '#FACC15'];
export const GRID_COLS = 6;
export const GRID_ROWS = 4;

/* -------------------------- Estructura Organizativa ------------------------ */

export type Dedication = 'tiempo-completo' | 'tiempo-parcial' | 'destajo';

export interface RoleItem {
  id: string;
  title: string;
  reportsTo: string;
  functions: string;
  profile: string;
  dedication: Dedication;
  hours: string;
  count: string;
}

export interface EstructuraOrganizativa {
  roles: RoleItem[];
}

export const EMPTY_ESTRUCTURA: EstructuraOrganizativa = { roles: [] };

export const DEDICATION_LABELS: Record<Dedication, string> = {
  'tiempo-completo': 'Tiempo completo',
  'tiempo-parcial': 'Tiempo parcial',
  destajo: 'Por destajo',
};

/* ------------------------------- Cronograma -------------------------------- */

export interface Milestone {
  id: string;
  name: string;
  category: string;
  startWeek: string;
  durationWeeks: string;
  critical: boolean;
  notes: string;
}

export interface Cronograma {
  inicio: string;
  hitos: Milestone[];
}

export const EMPTY_CRONOGRAMA: Cronograma = { inicio: '', hitos: [] };

export const MILESTONE_CATEGORIES: string[] = [
  'Adquisición de equipos',
  'Permisos y licencias',
  'Adecuación del espacio',
  'Contratación',
  'Pruebas piloto',
  'Inicio de operaciones',
];

/* ---------------------------------- Helpers -------------------------------- */

export function toNumber(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function storageKey(ownerId: string, name: string): string {
  return `tecnica:${ownerId}:${name}`;
}

export function readDraft<T>(ownerId: string, name: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(ownerId, name));
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

export async function fetchTecnica<T>(ownerId: string, name: TecnicaPage, fallback: T): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('formulacion_tecnica_contenido')
    .select('contenido')
    .eq('owner_id', ownerId)
    .eq('pagina', name)
    .maybeSingle();

  if (error) {
    console.log('Formulacion tecnica fetch error:', error.message);
    return readDraft<T>(ownerId, name, fallback);
  }
  if (data?.contenido) {
    return { ...fallback, ...(data.contenido as object) } as T;
  }
  return readDraft<T>(ownerId, name, fallback);
}

export function useTecnicaDraft<T>(ownerId: string, name: TecnicaPage, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [saveError, setSaveError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;
    setLoaded(false);
    fetchTecnica<T>(ownerId, name, fallback).then((result) => {
      if (cancelled) return;
      setValue(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, name]);

  useEffect(() => {
    if (!loaded || !ownerId) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        window.localStorage.setItem(storageKey(ownerId, name), JSON.stringify(value));
      } catch {
        // ignore storage quota errors
      }
      const supabase = createClient();
      const { error } = await supabase.from('formulacion_tecnica_contenido').upsert(
        {
          owner_id: ownerId,
          pagina: name,
          contenido: value as unknown as Record<string, unknown>,
        },
        { onConflict: 'owner_id,pagina' }
      );
      if (error) {
        console.log('Formulacion tecnica save error:', error.message);
        setSaveError(error.message);
        setSavedAt(false);
        return;
      }
      setSaveError('');
      setSavedAt(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSavedAt(false), 1500);
    }, 600);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value, loaded, ownerId, name]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const update = useCallback((updater: (prev: T) => T) => setValue(updater), []);

  return { value, setValue, update, loaded, savedAt, saveError };
}
