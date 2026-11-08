'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavTab } from '@/app/costos-variables/components/CostosShell';
import { createClient } from '@/lib/supabase/client';

export const PLASMANDO_TABS: NavTab[] = [
  { label: 'Árbol del Problema', href: '/arbol-problema', icon: 'ExclamationTriangleIcon' },
  { label: 'Árbol de Soluciones', href: '/arbol-soluciones', icon: 'LightBulbIcon' },
  { label: 'Marco Lógico', href: '/marco-logico', icon: 'TableCellsIcon' },
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ProblemItem {
  id: string;
  text: string;
}

export interface ProblemTree {
  problem: string;
  causes: ProblemItem[];
  effects: ProblemItem[];
}

export interface SolutionTree {
  objective: string;
  means: ProblemItem[];
  ends: ProblemItem[];
}

export interface LogicRow {
  summary: string;
  indicators: string;
  verification: string;
  assumptions: string;
}

export interface LogicComponent extends LogicRow {
  activities: LogicRow[];
}

export interface LogicFrame {
  fin: LogicRow;
  proposito: LogicRow;
  componentes: LogicComponent[];
}

export const EMPTY_PROBLEM_TREE: ProblemTree = { problem: '', causes: [], effects: [] };
export const EMPTY_SOLUTION_TREE: SolutionTree = { objective: '', means: [], ends: [] };

export const EMPTY_ROW: LogicRow = {
  summary: '',
  indicators: '',
  verification: '',
  assumptions: '',
};

export function emptyComponent(): LogicComponent {
  return { ...EMPTY_ROW, activities: [{ ...EMPTY_ROW }] };
}

export const EMPTY_FRAME: LogicFrame = {
  fin: { ...EMPTY_ROW },
  proposito: { ...EMPTY_ROW },
  componentes: [emptyComponent()],
};

export function normalizeFrame(raw: unknown): LogicFrame {
  const data = (raw ?? {}) as {
    fin?: Partial<LogicRow>;
    proposito?: Partial<LogicRow>;
    componentes?: Array<Partial<LogicComponent>>;
    actividades?: Array<Partial<LogicRow>>;
  };
  const legacyActivities = Array.isArray(data.actividades) ? data.actividades : [];
  const rawComponents =
    Array.isArray(data.componentes) && data.componentes.length > 0 ? data.componentes : [{}];
  const componentes: LogicComponent[] = rawComponents.map((c, index) => {
    const ownActivities = Array.isArray(c.activities) ? c.activities : null;
    const activities = ownActivities ?? (index === 0 ? legacyActivities : []);
    return {
      ...EMPTY_ROW,
      ...c,
      activities:
        activities.length > 0
          ? activities.map((a) => ({ ...EMPTY_ROW, ...a }))
          : [{ ...EMPTY_ROW }],
    };
  });
  return {
    fin: { ...EMPTY_ROW, ...data.fin },
    proposito: { ...EMPTY_ROW, ...data.proposito },
    componentes,
  };
}

export function storageKey(ownerId: string, name: string): string {
  return `plasmando:${ownerId}:${name}`;
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

export async function fetchPlasmando<T>(
  ownerId: string,
  name: string,
  fallback: T
): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plasmando_contenido')
    .select('contenido')
    .eq('owner_id', ownerId)
    .eq('pagina', name as 'arbol-problema' | 'arbol-soluciones' | 'marco-logico')
    .maybeSingle();

  if (error) {
    console.log('Plasmando fetch error:', error.message);
    return readDraft<T>(ownerId, name, fallback);
  }
  if (data?.contenido) {
    return { ...fallback, ...(data.contenido as object) } as T;
  }
  return readDraft<T>(ownerId, name, fallback);
}

export function useLocalDraft<T>(ownerId: string, name: string, fallback: T) {
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
    fetchPlasmando<T>(ownerId, name, fallback).then((result) => {
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
      const supabase = createClient();
      const { error } = await supabase.from('plasmando_contenido').upsert(
        {
          owner_id: ownerId,
          pagina: name as 'arbol-problema' | 'arbol-soluciones' | 'marco-logico',
          contenido: value as unknown as Record<string, unknown>,
        },
        { onConflict: 'owner_id,pagina' }
      );
      if (error) {
        console.log('Plasmando save error:', error.message);
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
