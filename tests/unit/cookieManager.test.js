/**
 * Cookie Manager Unit Tests
 */

// Import the module (adjust path as needed)
// For testing, we'll create a simplified version

describe('CookieManager', () => {
    let cookieManager;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create instance
        cookieManager = {
            getCookiesForUrl: async (url) => {
                return await chrome.cookies.getAll({ url });
            },
            getAllCookies: async () => {
                return await chrome.cookies.getAll({});
            },
            deleteCookie: async (cookie) => {
                const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
                return await chrome.cookies.remove({ url, name: cookie.name });
            },
            setCookie: async (cookie) => {
                const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
                return await chrome.cookies.set({ url, ...cookie });
            }
        };
    });

    describe('getCookiesForUrl', () => {
        test('should return cookies for a specific URL', async () => {
            const mockCookies = [
                { name: 'session', value: 'abc123', domain: '.example.com' },
                { name: 'user', value: 'john', domain: '.example.com' }
            ];

            chrome.cookies.getAll.mockResolvedValue(mockCookies);

            const result = await cookieManager.getCookiesForUrl('https://example.com');

            expect(chrome.cookies.getAll).toHaveBeenCalledWith({ url: 'https://example.com' });
            expect(result).toEqual(mockCookies);
            expect(result.length).toBe(2);
        });

        test('should return empty array when no cookies exist', async () => {
            chrome.cookies.getAll.mockResolvedValue([]);

            const result = await cookieManager.getCookiesForUrl('https://newsite.com');

            expect(result).toEqual([]);
        });

        test('should handle errors gracefully', async () => {
            chrome.cookies.getAll.mockRejectedValue(new Error('API Error'));

            await expect(cookieManager.getCookiesForUrl('https://example.com'))
                .rejects.toThrow('API Error');
        });
    });

    describe('getAllCookies', () => {
        test('should return all cookies', async () => {
            const mockCookies = [
                { name: 'cookie1', domain: '.site1.com' },
                { name: 'cookie2', domain: '.site2.com' },
                { name: 'cookie3', domain: '.site3.com' }
            ];

            chrome.cookies.getAll.mockResolvedValue(mockCookies);

            const result = await cookieManager.getAllCookies();

            expect(chrome.cookies.getAll).toHaveBeenCalledWith({});
            expect(result.length).toBe(3);
        });
    });

    describe('deleteCookie', () => {
        test('should delete a secure cookie', async () => {
            const cookie = {
                name: 'session',
                domain: '.example.com',
                path: '/',
                secure: true
            };

            chrome.cookies.remove.mockResolvedValue({ name: 'session' });

            await cookieManager.deleteCookie(cookie);

            expect(chrome.cookies.remove).toHaveBeenCalledWith({
                url: 'https://example.com/',
                name: 'session'
            });
        });

        test('should delete a non-secure cookie', async () => {
            const cookie = {
                name: 'tracking',
                domain: '.example.com',
                path: '/',
                secure: false
            };

            chrome.cookies.remove.mockResolvedValue({ name: 'tracking' });

            await cookieManager.deleteCookie(cookie);

            expect(chrome.cookies.remove).toHaveBeenCalledWith({
                url: 'http://example.com/',
                name: 'tracking'
            });
        });
    });

    describe('setCookie', () => {
        test('should create a new cookie', async () => {
            const cookie = {
                name: 'newCookie',
                value: 'newValue',
                domain: '.example.com',
                path: '/',
                secure: true
            };

            chrome.cookies.set.mockResolvedValue(cookie);

            await cookieManager.setCookie(cookie);

            expect(chrome.cookies.set).toHaveBeenCalled();
        });
    });
});

describe('Cookie Statistics', () => {
    test('should calculate correct statistics', () => {
        const cookies = [
            { name: 'c1', secure: true, httpOnly: true, session: false },
            { name: 'c2', secure: true, httpOnly: false, session: true },
            { name: 'c3', secure: false, httpOnly: true, session: false },
            { name: 'c4', secure: false, httpOnly: false, session: true }
        ];

        const stats = {
            total: cookies.length,
            secure: cookies.filter(c => c.secure).length,
            httpOnly: cookies.filter(c => c.httpOnly).length,
            session: cookies.filter(c => c.session).length,
            persistent: cookies.filter(c => !c.session).length
        };

        expect(stats.total).toBe(4);
        expect(stats.secure).toBe(2);
        expect(stats.httpOnly).toBe(2);
        expect(stats.session).toBe(2);
        expect(stats.persistent).toBe(2);
    });
});

describe('Tracking Cookie Detection', () => {
    const trackingPatterns = [
        '_ga', '_gid', '_gat', '_fbp', '_fbc', 'doubleclick',
        'adsense', 'criteo', 'analytics', 'tracking'
    ];

    function isTrackingCookie(cookie) {
        const cookieStr = (cookie.name + cookie.domain).toLowerCase();
        return trackingPatterns.some(pattern => cookieStr.includes(pattern));
    }

    test('should detect Google Analytics cookies', () => {
        expect(isTrackingCookie({ name: '_ga', domain: '.example.com' })).toBe(true);
        expect(isTrackingCookie({ name: '_gid', domain: '.example.com' })).toBe(true);
    });

    test('should detect Facebook cookies', () => {
        expect(isTrackingCookie({ name: '_fbp', domain: '.example.com' })).toBe(true);
    });

    test('should not flag regular cookies', () => {
        expect(isTrackingCookie({ name: 'session', domain: '.example.com' })).toBe(false);
        expect(isTrackingCookie({ name: 'user_pref', domain: '.example.com' })).toBe(false);
    });
});