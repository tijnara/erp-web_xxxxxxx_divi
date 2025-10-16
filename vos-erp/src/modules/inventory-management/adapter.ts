import { InventoryItem } from './types';

export const inventoryAdapter = {
    toClient(data: any): InventoryItem {
        return {
            ...data,
            available_quantity: data.quantity - data.reserved_quantity,
        };
    },
};
