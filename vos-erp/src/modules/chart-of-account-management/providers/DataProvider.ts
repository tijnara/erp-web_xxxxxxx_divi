import type { ChartOfAccount, UpsertChartOfAccountDTO } from "../types";

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

export interface DataProvider {
    listChartOfAccounts(params: ListParams): Promise<{ items: ChartOfAccount[]; total: number }>;
    getChartOfAccount(id: string | number): Promise<ChartOfAccount>;
    createChartOfAccount(data: UpsertChartOfAccountDTO): Promise<ChartOfAccount>;
    updateChartOfAccount(id: string | number, data: UpsertChartOfAccountDTO): Promise<ChartOfAccount>;
    deleteChartOfAccount(id: string | number): Promise<void>;
}

