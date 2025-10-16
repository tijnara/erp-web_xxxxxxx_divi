// DataProvider.ts
import { fetchInventory } from './HttpDataProvider';
import { InventoryItem } from '../types';

export const inventoryDataProvider = {
    async list(): Promise<InventoryItem[]> {
        return await fetchInventory(); // use the new function
    },
};
