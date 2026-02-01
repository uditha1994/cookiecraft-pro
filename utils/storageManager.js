// ========================================
// Storage Manager Utility
// ========================================

export class StorageManager {

    constructor(storageArea = 'local') {
        this.storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
    }

    /**
     * Get value from storage
     */
    async get(key) {
        try {
            const result = await this.storage.get(key);
            return result[key];
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    /**
     * Get multiple values from storage
     */
    async getMultiple(keys) {
        try {
            return await this.storage.get(keys);
        } catch (error) {
            console.error('Storage getMultiple error:', error);
            return {};
        }
    }

    /**
     * Set value in storage
     */
    async set(key, value) {
        try {
            await this.storage.set({ [key]: value });
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * Set multiple values in storage
     */
    async setMultiple(items) {
        try {
            await this.storage.set(items);
            return true;
        } catch (error) {
            console.error('Storage setMultiple error:', error);
            return false;
        }
    }

    /**
     * Remove value from storage
     */
    async remove(key) {
        try {
            await this.storage.remove(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Remove multiple values from storage
     */
    async removeMultiple(keys) {
        try {
            await this.storage.remove(keys);
            return true;
        } catch (error) {
            console.error('Storage removeMultiple error:', error);
            return false;
        }
    }

    /**
     * Clear all storage
     */
    async clear() {
        try {
            await this.storage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * Get all items from storage
     */
    async getAll() {
        try {
            return await this.storage.get(null);
        } catch (error) {
            console.error('Storage getAll error:', error);
            return {};
        }
    }

    /**
     * Get storage usage
     */
    async getUsage() {
        try {
            const bytesInUse = await this.storage.getBytesInUse(null);
            return {
                bytesInUse,
                formattedSize: this.formatBytes(bytesInUse)
            };
        } catch (error) {
            console.error('Storage getUsage error:', error);
            return { bytesInUse: 0, formattedSize: '0 B' };
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        const value = await this.get(key);
        return value !== undefined && value !== null;
    }

    /**
     * Update value (merge with existing)
     */
    async update(key, updates) {
        const existing = await this.get(key) || {};
        const merged = { ...existing, ...updates };
        return await this.set(key, merged);
    }

    /**
     * Add item to array in storage
     */
    async pushToArray(key, item) {
        const existing = await this.get(key) || [];
        existing.push(item);
        return await this.set(key, existing);
    }

    /**
     * Remove item from array in storage
     */
    async removeFromArray(key, predicate) {
        const existing = await this.get(key) || [];
        const filtered = existing.filter((item, index) => !predicate(item, index));
        return await this.set(key, filtered);
    }

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Listen for storage changes
     */
    onChanged(callback) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if ((this.storage === chrome.storage.local && areaName === 'local') ||
                (this.storage === chrome.storage.sync && areaName === 'sync')) {
                callback(changes);
            }
        });
    }
}