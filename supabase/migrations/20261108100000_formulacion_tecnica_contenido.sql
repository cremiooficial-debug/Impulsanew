-- Formulacion Tecnica: contenido de Ficha Tecnica, Mapa de Procesos, Activos Requeridos,
-- Distribucion en Planta, Estructura Organizativa y Cronograma de Implementacion.
-- Una fila por usuario y pagina; el contenido se guarda como JSONB.
-- Execute this script in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.formulacion_tecnica_contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  pagina TEXT NOT NULL,
  contenido JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT formulacion_tecnica_contenido_pagina_check
    CHECK (pagina IN (
      'ficha-tecnica',
      'mapa-procesos',
      'activos-requeridos',
      'distribucion-planta',
      'estructura-organizativa',
      'cronograma-implementacion'
    )),
  CONSTRAINT formulacion_tecnica_contenido_owner_pagina_unique UNIQUE (owner_id, pagina)
);

CREATE INDEX IF NOT EXISTS idx_formulacion_tecnica_contenido_owner_id
ON public.formulacion_tecnica_contenido(owner_id);

CREATE OR REPLACE FUNCTION public.formulacion_tecnica_contenido_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$func$;

ALTER TABLE public.formulacion_tecnica_contenido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS formulacion_tecnica_contenido_owner_select ON public.formulacion_tecnica_contenido;
CREATE POLICY formulacion_tecnica_contenido_owner_select
ON public.formulacion_tecnica_contenido
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS formulacion_tecnica_contenido_owner_insert ON public.formulacion_tecnica_contenido;
CREATE POLICY formulacion_tecnica_contenido_owner_insert
ON public.formulacion_tecnica_contenido
FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS formulacion_tecnica_contenido_owner_update ON public.formulacion_tecnica_contenido;
CREATE POLICY formulacion_tecnica_contenido_owner_update
ON public.formulacion_tecnica_contenido
FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS formulacion_tecnica_contenido_owner_delete ON public.formulacion_tecnica_contenido;
CREATE POLICY formulacion_tecnica_contenido_owner_delete
ON public.formulacion_tecnica_contenido
FOR DELETE TO authenticated
USING (owner_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS formulacion_tecnica_contenido_updated_at ON public.formulacion_tecnica_contenido;
CREATE TRIGGER formulacion_tecnica_contenido_updated_at
BEFORE UPDATE ON public.formulacion_tecnica_contenido
FOR EACH ROW EXECUTE FUNCTION public.formulacion_tecnica_contenido_set_updated_at();
