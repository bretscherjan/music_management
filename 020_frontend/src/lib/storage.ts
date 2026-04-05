import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// In-memory cache shared by both web (fallback) and native (primary sync store)
const memoryStore = new Map<string, string>();

const isNative = Capacitor.isNativePlatform();

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

const hasLocalStorage = !isNative && typeof window !== 'undefined' && canUseLocalStorage();

export const storage = {
    /**
     * Synchronous read.
     * - Native: returns from in-memory cache (must call initFromPreferences first).
     * - Web: reads from localStorage, falls back to memory.
     */
    getItem(key: string): string | null {
        if (isNative) {
            return memoryStore.get(key) ?? null;
        }
        if (hasLocalStorage) {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return memoryStore.get(key) ?? null;
            }
        }
        return memoryStore.get(key) ?? null;
    },

    /**
     * Synchronous write.
     * - Native: writes to memory cache immediately + async to Capacitor Preferences.
     * - Web: writes to localStorage + memory cache.
     */
    setItem(key: string, value: string): void {
        memoryStore.set(key, value);
        if (isNative) {
            Preferences.set({ key, value }).catch((err) =>
                console.error('[storage] Preferences.set failed:', err)
            );
        } else if (hasLocalStorage) {
            try {
                window.localStorage.setItem(key, value);
            } catch { /* memory already written */ }
        }
    },

    removeItem(key: string): void {
        memoryStore.delete(key);
        if (isNative) {
            Preferences.remove({ key }).catch((err) =>
                console.error('[storage] Preferences.remove failed:', err)
            );
        } else if (hasLocalStorage) {
            try {
                window.localStorage.removeItem(key);
            } catch { /* ignore */ }
        }
    },

    /**
     * Async startup init: loads the given keys from Capacitor Preferences into
     * the memory cache. Must be awaited before any getItem() call on native.
     * No-op on web.
     */
    async initFromPreferences(keys: string[]): Promise<void> {
        if (!isNative) return;
        await Promise.all(
            keys.map(async (key) => {
                try {
                    const { value } = await Preferences.get({ key });
                    if (value !== null) {
                        memoryStore.set(key, value);
                    }
                } catch (err) {
                    console.error(`[storage] Failed to load "${key}" from Preferences:`, err);
                }
            })
        );
    },
};

export default storage;
