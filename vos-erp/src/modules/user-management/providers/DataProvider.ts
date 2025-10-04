import type { User, UpsertUserDTO } from "../types";

export type ListParams = {
    q?: string;
    limit?: number;
    offset?: number;
};

export interface DataProvider {
    listUsers(params: ListParams): Promise<{ items: User[]; total: number }>;
    getUser(id: string | number): Promise<User>;
    createUser(data: UpsertUserDTO): Promise<User>;
    updateUser(id: string | number, data: UpsertUserDTO): Promise<User>;
    deleteUser(id: string | number): Promise<void>;
}

