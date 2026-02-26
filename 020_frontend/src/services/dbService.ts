import api from '@/lib/api';

export interface DbTable {
    name: string;
    rowCount: number;
    dataSize: number;
    createdAt: string;
}

export interface TableColumn {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: any;
    Extra: string;
}

export interface TableDataResponse {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface DbRelation {
    tableName: string;
    columnName: string;
    constraintName: string;
    referencedTableName: string;
    referencedColumnName: string;
}

export const dbService = {
    getTables: async () => {
        const response = await api.get<DbTable[]>('/db/tables');
        return response.data;
    },
    getRelations: async () => {
        const response = await api.get<DbRelation[]>('/db/relations');
        return response.data;
    },
    getTableColumns: async (tableName: string) => {
        const response = await api.get<TableColumn[]>(`/db/tables/${tableName}/columns`);
        return response.data;
    },
    getTableData: async (tableName: string, params: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
        const response = await api.get<TableDataResponse>(`/db/tables/${tableName}/data`, { params });
        return response.data;
    },
    executeSql: async (sql: string) => {
        const response = await api.post<{ success: boolean; result: any; type: string }>('/db/execute-sql', { sql });
        return response.data;
    },
    updateRow: async (tableName: string, primaryKey: string, primaryKeyValue: any, data: any) => {
        const response = await api.put(`/db/tables/${tableName}/row`, { primaryKey, primaryKeyValue, data });
        return response.data;
    }
};
