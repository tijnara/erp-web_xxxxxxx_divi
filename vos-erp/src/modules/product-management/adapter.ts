// src/modules/product-management/adapter.ts
import type { Product, UpsertProductDTO, Ref, UnitRef } from './types';

function asBool(v: any): boolean {
    if (v === 1 || v === true) return true;
    if (v === 0 || v === false || v == null) return false;
    if (typeof v === 'object' && Array.isArray(v?.data)) return v.data[0] === 1; // BIT(1)
    return Boolean(v);
}

export function fromDirectusRow(row: any): Product {
    const unit = row.unit_of_measurement
        ? ({ id: row.unit_of_measurement.unit_id, name: row.unit_of_measurement.unit_name, shortcut: row.unit_of_measurement.unit_shortcut ?? null } as UnitRef)
        : null;
    const brand    = row.product_brand    ? ({ id: row.product_brand.brand_id,       name: row.product_brand.brand_name } as Ref)       : null;
    const category = row.product_category ? ({ id: row.product_category.category_id, name: row.product_category.category_name } as Ref) : null;
    const segment  = row.product_segment  ? ({ id: row.product_segment.segment_id,    name: 'fixme' } as Ref)  : null;
    const section  = row.product_section  ? ({ id: row.product_section.section_id,    name: 'fixme' } as Ref)  : null;

    return {
        id: row.product_id,
        code: row.product_code ?? null,
        barcode: row.barcode ?? null,
        name: row.product_name ?? '',
        description: row.description ?? null,
        weight_kg: row.product_weight ?? null,
        stock_qty: row.stock_qty ?? null, // Not in sample, but good to have
        maintaining_quantity: row.maintaining_quantity ?? null,
        base_price: row.price_per_unit ?? null,
        cost: row.cost_per_unit ?? null,
        isActive: asBool(row.isActive),
        created_at: row.created_at,
        last_updated: row.last_updated,
        created_by: row.created_by,

        unit, brand, category, segment, section,
    };
}

export function toDirectusBody(dto: UpsertProductDTO) {
    return {
        product_name: dto.name,
        product_code: dto.code ?? null,
        barcode: dto.barcode ?? null,
        description: dto.description ?? null,
        product_weight: dto.weight_kg ?? null,
        maintaining_quantity: dto.maintaining_quantity ?? null,
        price_per_unit: dto.base_price ?? null,
        cost_per_unit: dto.cost ?? null,
        isActive: dto.isActive == null ? undefined : (dto.isActive ? 1 : 0),
        created_by: dto.created_by ?? null,

        // relation FK columns (IDs)
        unit_of_measurement: dto.unitId ?? null,
        product_brand: dto.brandId ?? null,
        product_category: dto.categoryId ?? null,
        product_segment: dto.segmentId ?? null,
        product_section: dto.sectionId ?? null,
    };
}

// Helper to keep fields list in one place
export const ENRICHED_FIELDS =
    [
        'product_id','product_name','product_code','barcode','price_per_unit','cost_per_unit','isActive','last_updated', 'created_at', 'created_by', 'maintaining_quantity',
        'unit_of_measurement.unit_id','unit_of_measurement.unit_name','unit_of_measurement.unit_shortcut',
        'product_brand.brand_id','product_brand.brand_name',
        'product_category.category_id','product_category.category_name',
        'product_segment.segment_id',
        'product_section.section_id',
    ].join(',');
