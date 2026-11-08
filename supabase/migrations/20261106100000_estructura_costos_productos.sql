-- Estructura de costos por producto: produccion mensual, % de ganancia y % de impuesto.
-- Execute this script in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.estructura_costos_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  producto_id UUID NOT NULL REFERENCES public.productos_receta(id) ON DELETE CASCADE,
  usuario TEXT NOT NULL,
  produccion_mensual NUMERIC NOT NULL DEFAULT 0,
  porcentaje_ganancia NUMERIC NOT NULL DEFAULT 0,
  porcentaje_impuesto NUMERIC NOT NULL DEFAULT 16,
  fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT estructura_costos_productos_producto_unique UNIQUE (producto_id)
);

CREATE INDEX IF NOT EXISTS idx_estructura_costos_productos_owner_id
ON public.estructura_costos_productos(owner_id);

ALTER TABLE public.estructura_costos_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS estructura_costos_productos_owner_select ON public.estructura_costos_productos;
CREATE POLICY estructura_costos_productos_owner_select
ON public.estructura_costos_productos
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS estructura_costos_productos_owner_insert ON public.estructura_costos_productos;
CREATE POLICY estructura_costos_productos_owner_insert
ON public.estructura_costos_productos
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.productos_receta
    WHERE productos_receta.id = estructura_costos_productos.producto_id
      AND productos_receta.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS estructura_costos_productos_owner_update ON public.estructura_costos_productos;
CREATE POLICY estructura_costos_productos_owner_update
ON public.estructura_costos_productos
FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.productos_receta
    WHERE productos_receta.id = estructura_costos_productos.producto_id
      AND productos_receta.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS estructura_costos_productos_owner_delete ON public.estructura_costos_productos;
CREATE POLICY estructura_costos_productos_owner_delete
ON public.estructura_costos_productos
FOR DELETE TO authenticated
USING (owner_id = (SELECT auth.uid()));
