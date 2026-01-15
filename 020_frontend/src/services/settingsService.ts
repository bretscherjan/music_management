import api from '@/lib/api';

export interface Setting {
    id: number;
    key: string;
    value: string;
}

export interface SettingsMap {
    [key: string]: string;
}

export const settingsService = {
    async getAll(): Promise<SettingsMap> {
        const response = await api.get<{ settings: SettingsMap }>('/settings');
        return response.data.settings;
    },

    async get(key: string): Promise<Setting> {
        const response = await api.get<{ setting: Setting }>(`/settings/${key}`);
        return response.data.setting;
    },

    async update(key: string, value: string): Promise<Setting> {
        const response = await api.put<{ setting: Setting; message: string }>(`/settings/${key}`, { value });
        return response.data.setting;
    },
};

export default settingsService;
