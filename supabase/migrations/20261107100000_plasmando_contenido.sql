-- Plasmando la Idea: contenido de Arbol del Problema, Arbol de Soluciones y Marco Logico.
-- Una fila por usuario y pagina; el contenido se guarda como JSONB.
-- Execute this script in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.plasmando_contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  pagina TEXT NOT NULL,
  contenido JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT plasmando_contenido_pagina_check
    CHECK (pagina IN ('arbol-problema', 'arbol-soluciones', 'marco-logico')),
  CONSTRAINT plasmando_contenido_owner_pagina_unique UNIQUE (owner_id, pagina)
);

CREATE INDEX IF NOT EXISTS idx_plasmando_contenido_owner_id
ON public.plasmando_contenido(owner_id);

CREATE OR REPLACE FUNCTION public.plasmando_contenido_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$func$;

ALTER TABLE public.plasmando_contenido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plasmando_contenido_owner_select ON public.plasmando_contenido;
CREATE POLICY plasmando_contenido_owner_select
ON public.plasmando_contenido
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS plasmando_contenido_owner_insert ON public.plasmando_contenido;
CREATE POLICY plasmando_contenido_owner_insert
ON public.plasmando_contenido
FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS plasmando_contenido_owner_update ON public.plasmando_contenido;
CREATE POLICY plasmando_contenido_owner_update
ON public.plasmando_contenido
FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS plasmando_contenido_owner_delete ON public.plasmando_contenido;
CREATE POLICY plasmando_contenido_owner_delete
ON public.plasmando_contenido
FOR DELETE TO authenticated
USING (owner_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS plasmando_contenido_updated_at ON public.plasmando_contenido;
CREATE TRIGGER plasmando_contenido_updated_at
BEFORE UPDATE ON public.plasmando_contenido
FOR EACH ROW EXECUTE FUNCTION public.plasmando_contenido_set_updated_at();
