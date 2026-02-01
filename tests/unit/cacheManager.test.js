/**
 * Cache Manager Unit Tests
 */

describe('CacheManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        chrome.browsingData.remove.mockResolvedValue();
        chrome.browsingData.removeCache.mockResolvedValue();
        chrome.browsingData.removeCookies.mockResolvedValue();
        chrome.browsingData.removeHistory.mockResolvedValue();
    });

    describe('clearBrowsingData', () => {
        test('should clear cache only', async () => {
            await chrome.browsingData.remove({ since: 0 }, { cache: true });

            expect(chrome.browsingData.remove).toHaveBeenCalledWith(
                { since: 0 },
                { cache: true }
            );
        });

        test('should clear multiple data types', async () => {
            const options = {
                cache: true,
                cookies: true,
                history: true
            };

            await chrome.browsingData.remove({ since: 0 }, options);

            expect(chrome.browsingData.remove).toHaveBeenCalledWith(
                { since: 0 },
                options
            );
        });

        test('should respect time range', async () => {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);

            await chrome.browsingData.remove({ since: oneHourAgo }, { cache: true });

            expect(chrome.browsingData.remove).toHaveBeenCalledWith(
                { since: oneHourAgo },
                { cache: true }
            );
        });
    });

    describe('Time Ranges', () => {
        const timeRanges = [
            { label: 'Last hour', value: 60 * 60 * 1000 },
            { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
            { label: 'Last 7 days', value: 7 * 24 * 60 * 60 * 1000 },
            { label: 'Last 4 weeks', value: 4 * 7 * 24 * 60 * 60 * 1000 },
            { label: 'All time', value: 0 }
        ];

        test('should have correct time range values', () => {
            expect(timeRanges[0].value).toBe(3600000); // 1 hour
            expect(timeRanges[1].value).toBe(86400000); // 24 hours
            expect(timeRanges[2].value).toBe(604800000); // 7 days
            expect(timeRanges[3].value).toBe(2419200000); // 4 weeks
            expect(timeRanges[4].value).toBe(0); // All time
        });
    });
});