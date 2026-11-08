type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

type CostCatalogRow = {
  id: string;
  owner_id: string | null;
  usuario: string;
  dependencia: string;
  unidad: string;
  cantidad_comprada: number;
  precio_compra: number;
  fecha: string;
};

type CostCatalogInsert = {
  id?: string;
  owner_id?: string | null;
  usuario: string;
  dependencia?: string;
  unidad?: string;
  cantidad_comprada?: number;
  precio_compra?: number;
  fecha?: string;
};

type FixedCostBaseRow = {
  id: string;
  owner_id: string | null;
  usuario: string;
  dependencia: string;
  costo_mensual: number;
  fecha: string;
};

type OwnedRow = {
  id: string;
  owner_id: string | null;
  usuario: string;
  dependencia: string;
  fecha: string;
};

type FixedCostBaseInsert = {
  id?: string;
  owner_id?: string | null;
  usuario: string;
  dependencia?: string;
  costo_mensual?: number;
  fecha?: string;
};

export interface Database {
  public: {
    Tables: {
      materiales: Table<
        CostCatalogRow & { material: string; costo_unitario: number },
        CostCatalogInsert & { material: string; costo_unitario?: number }
      >;
      empaques: Table<
        CostCatalogRow & { empaque: string; costo: number },
        CostCatalogInsert & { empaque: string; costo?: number }
      >;
      etiquetas: Table<
        CostCatalogRow & { etiqueta: string; costo: number },
        CostCatalogInsert & { etiqueta: string; costo?: number }
      >;
      costos_fijos_personal: Table<
        FixedCostBaseRow & { nombre: string; cargo: string },
        FixedCostBaseInsert & { nombre: string; cargo?: string }
      >;
      costos_fijos_equipos: Table<
        FixedCostBaseRow & {
          equipo: string;
          precio_compra: number;
          vida_util_meses: number;
        },
        FixedCostBaseInsert & {
          equipo: string;
          precio_compra?: number;
          vida_util_meses?: number;
        }
      >;
      costos_fijos_servicios: Table<
        FixedCostBaseRow & { servicio: string; proveedor: string },
        FixedCostBaseInsert & { servicio: string; proveedor?: string }
      >;
      productos_receta: Table<
        OwnedRow & {
          nombre: string;
          rendimiento: number;
          costo_fijo_unitario: number;
          ganancia_unitaria: number;
          impuesto_unitario: number;
        },
        {
          id?: string;
          owner_id?: string | null;
          usuario: string;
          dependencia?: string;
          fecha?: string;
          nombre: string;
          rendimiento?: number;
          costo_fijo_unitario?: number;
          ganancia_unitaria?: number;
          impuesto_unitario?: number;
        }
      >;
      producto_ingredientes: Table<
        {
          id: string;
          owner_id: string | null;
          producto_id: string;
          usuario: string;
          tipo: 'material' | 'empaque' | 'etiqueta';
          item_id: string;
          cantidad: number;
          unidad: string;
          fecha: string;
        },
        {
          id?: string;
          owner_id?: string | null;
          producto_id: string;
          usuario: string;
          tipo: 'material' | 'empaque' | 'etiqueta';
          item_id: string;
          cantidad?: number;
          unidad?: string;
          fecha?: string;
        }
      >;
      estructura_costos_productos: Table<
        {
          id: string;
          owner_id: string | null;
          producto_id: string;
          usuario: string;
          produccion_mensual: number;
          porcentaje_ganancia: number;
          porcentaje_impuesto: number;
          fecha: string;
        },
        {
          id?: string;
          owner_id?: string | null;
          producto_id: string;
          usuario: string;
          produccion_mensual?: number;
          porcentaje_ganancia?: number;
          porcentaje_impuesto?: number;
          fecha?: string;
        }
      >;
      plasmando_contenido: Table<
        {
          id: string;
          owner_id: string;
          pagina: 'arbol-problema' | 'arbol-soluciones' | 'marco-logico';
          contenido: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          owner_id?: string;
          pagina: 'arbol-problema' | 'arbol-soluciones' | 'marco-logico';
          contenido?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        }
      >;
      formulacion_tecnica_contenido: Table<
        {
          id: string;
          owner_id: string;
          pagina:
            | 'ficha-tecnica' |'mapa-procesos' |'activos-requeridos' |'distribucion-planta' |'estructura-organizativa' |'cronograma-implementacion';
          contenido: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          owner_id?: string;
          pagina:
            | 'ficha-tecnica' |'mapa-procesos' |'activos-requeridos' |'distribucion-planta' |'estructura-organizativa' |'cronograma-implementacion';
          contenido?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
