// ========================================
// Cache Manager Utility
// ========================================

export class CacheManager {

    /**
     * Clear browsing data based on options
     */
    async clearBrowsingData(options = {}, since = 0) {
        const dataToRemove = {};

        if (options.removeHistory) {
            dataToRemove.history = true;
        }

        if (options.removeDownloads) {
            dataToRemove.downloads = true;
        }

        if (options.removeCache) {
            dataToRemove.cache = true;
        }

        if (options.removeFormData) {
            dataToRemove.formData = true;
        }

        if (options.removeLocalStorage) {
            dataToRemove.localStorage = true;
        }

        if (options.removeCookies) {
            dataToRemove.cookies = true;
        }

        if (options.removePasswords) {
            dataToRemove.passwords = true;
        }

        if (options.removeServiceWorkers) {
            dataToRemove.serviceWorkers = true;
        }

        const removalOptions = {
            since: since || 0
        };

        try {
            await chrome.browsingData.remove(removalOptions, dataToRemove);
            return { success: true };
        } catch (error) {
            console.error('Error clearing browsing data:', error);
            throw error;
        }
    }

    /**
     * Clear only cache
     */
    async clearCache(since = 0) {
        try {
            await chrome.browsingData.removeCache({ since });
            return { success: true };
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }

    /**
     * Clear only cookies
     */
    async clearCookies(since = 0) {
        try {
            await chrome.browsingData.removeCookies({ since });
            return { success: true };
        } catch (error) {
            console.error('Error clearing cookies:', error);
            throw error;
        }
    }

    /**
     * Clear only local storage
     */
    async clearLocalStorage(since = 0) {
        try {
            await chrome.browsingData.removeLocalStorage({ since });
            return { success: true };
        } catch (error) {
            console.error('Error clearing local storage:', error);
            throw error;
        }
    }

    /**
     * Clear only history
     */
    async clearHistory(since = 0) {
        try {
            await chrome.browsingData.removeHistory({ since });
            return { success: true };
        } catch (error) {
            console.error('Error clearing history:', error);
            throw error;
        }
    }

    /**
     * Clear data for specific origin
     */
    async clearDataForOrigin(origin, dataTypes = ['cache', 'cookies', 'localStorage']) {
        const dataToRemove = {};

        dataTypes.forEach(type => {
            switch (type) {
                case 'cache':
                    dataToRemove.cache = true;
                    break;
                case 'cookies':
                    dataToRemove.cookies = true;
                    break;
                case 'localStorage':
                    dataToRemove.localStorage = true;
                    break;
                case 'indexedDB':
                    dataToRemove.indexedDB = true;
                    break;
                case 'serviceWorkers':
                    dataToRemove.serviceWorkers = true;
                    break;
            }
        });

        try {
            await chrome.browsingData.remove({
                origins: [origin]
            }, dataToRemove);
            return { success: true };
        } catch (error) {
            console.error('Error clearing data for origin:', error);
            throw error;
        }
    }

    /**
     * Get cache storage estimate (where supported)
     */
    async getStorageEstimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    usageDetails: estimate.usageDetails
                };
            } catch (error) {
                console.error('Error getting storage estimate:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Get time range options
     */
    getTimeRanges() {
        return [
            { label: 'Last hour', value: 60 * 60 * 1000 },
            { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
            { label: 'Last 7 days', value: 7 * 24 * 60 * 60 * 1000 },
            { label: 'Last 4 weeks', value: 4 * 7 * 24 * 60 * 60 * 1000 },
            { label: 'All time', value: 0 }
        ];
    }

    /**
     * Clear all browsing data
     */
    async clearAll(since = 0) {
        return this.clearBrowsingData({
            removeHistory: true,
            removeDownloads: true,
            removeCache: true,
            removeFormData: true,
            removeLocalStorage: true,
            removeCookies: true,
            removePasswords: false,
            removeServiceWorkers: true
        }, since);
    }
}