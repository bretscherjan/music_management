const memoryStore = new Map<string, string>();

function canUseLocalStorage(): boolean {
    try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

const hasLocalStorage = typeof window !== 'undefined' && canUseLocalStorage();

export const storage = {
    getItem(key: string): string | null {
        if (hasLocalStorage) {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return memoryStore.get(key) ?? null;
            }
        }
        return memoryStore.get(key) ?? null;
    },

    setItem(key: string, value: string): void {
        if (hasLocalStorage) {
            try {
                window.localStorage.setItem(key, value);
                return;
            } catch {
                memoryStore.set(key, value);
                return;
            }
        }
        memoryStore.set(key, value);
    },

    removeItem(key: string): void {
        if (hasLocalStorage) {
            try {
                window.localStorage.removeItem(key);
            } catch {
                memoryStore.delete(key);
            }
            return;
        }
        memoryStore.delete(key);
    }
};

export default storage;
