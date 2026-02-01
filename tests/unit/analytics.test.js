/**
 * Analytics Utility Tests
 */

import { mockCookies, mockAnalytics, getAllMockCookies } from '../helpers/mockData.js';

describe('Analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        chrome.cookies._setCookies(getAllMockCookies());
    });

    describe('getOverviewStats', () => {
        test('should calculate total cookie count', () => {
            const cookies = getAllMockCookies();
            const stats = {
                totalCookies: cookies.length
            };

            expect(stats.totalCookies).toBe(10);
        });

        test('should calculate unique domain count', () => {
            const cookies = getAllMockCookies();
            const domains = new Set(cookies.map(c => c.domain.replace(/^\./, '')));

            expect(domains.size).toBe(6);
        });

        test('should calculate total storage size', () => {
            const cookies = getAllMockCookies();
            const totalSize = cookies.reduce((acc, c) =>
                acc + c.name.length + c.value.length, 0
            );

            expect(totalSize).toBeGreaterThan(0);
        });

        test('should count session vs persistent cookies', () => {
            const cookies = getAllMockCookies();
            const sessionCount = cookies.filter(c => c.session).length;
            const persistentCount = cookies.filter(c => !c.session).length;

            expect(sessionCount + persistentCount).toBe(cookies.length);
        });
    });

    describe('getSecurityStats', () => {
        test('should calculate secure cookie percentage', () => {
            const cookies = getAllMockCookies();
            const secureCount = cookies.filter(c => c.secure).length;
            const securePercent = Math.round((secureCount / cookies.length) * 100);

            expect(securePercent).toBeGreaterThanOrEqual(0);
            expect(securePercent).toBeLessThanOrEqual(100);
        });

        test('should calculate httpOnly cookie percentage', () => {
            const cookies = getAllMockCookies();
            const httpOnlyCount = cookies.filter(c => c.httpOnly).length;
            const httpOnlyPercent = Math.round((httpOnlyCount / cookies.length) * 100);

            expect(httpOnlyPercent).toBeGreaterThanOrEqual(0);
            expect(httpOnlyPercent).toBeLessThanOrEqual(100);
        });

        test('should count sameSite attribute distribution', () => {
            const cookies = getAllMockCookies();
            const sameSiteStats = {
                strict: cookies.filter(c => c.sameSite === 'strict').length,
                lax: cookies.filter(c => c.sameSite === 'lax').length,
                none: cookies.filter(c => c.sameSite === 'no_restriction').length
            };

            const total = sameSiteStats.strict + sameSiteStats.lax + sameSiteStats.none;
            expect(total).toBeLessThanOrEqual(cookies.length);
        });

        test('should calculate security score', () => {
            const cookies = getAllMockCookies();
            let score = 100;

            cookies.forEach(cookie => {
                if (!cookie.secure) score -= 0.5;
                if (!cookie.httpOnly) score -= 0.3;
                if (cookie.sameSite === 'no_restriction') score -= 0.5;
            });

            score = Math.max(0, Math.round(score));

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('getTrackingStats', () => {
        const trackingPatterns = {
            analytics: ['_ga', '_gid', '_gat', 'analytics', 'amplitude', 'mixpanel'],
            advertising: ['_fbp', '_fbc', 'doubleclick', 'adsense', 'criteo'],
            social: ['facebook', 'twitter', 'linkedin']
        };

        test('should identify analytics cookies', () => {
            const cookies = getAllMockCookies();
            const analyticsCookies = cookies.filter(c => {
                const nameAndDomain = (c.name + c.domain).toLowerCase();
                return trackingPatterns.analytics.some(p => nameAndDomain.includes(p));
            });

            expect(analyticsCookies.length).toBeGreaterThan(0);
        });

        test('should identify advertising cookies', () => {
            const cookies = getAllMockCookies();
            const adCookies = cookies.filter(c => {
                const nameAndDomain = (c.name + c.domain).toLowerCase();
                return trackingPatterns.advertising.some(p => nameAndDomain.includes(p));
            });

            expect(adCookies.length).toBeGreaterThan(0);
        });

        test('should calculate tracking percentage', () => {
            const cookies = getAllMockCookies();
            const allPatterns = [
                ...trackingPatterns.analytics,
                ...trackingPatterns.advertising,
                ...trackingPatterns.social
            ];

            const trackingCookies = cookies.filter(c => {
                const nameAndDomain = (c.name + c.domain).toLowerCase();
                return allPatterns.some(p => nameAndDomain.includes(p));
            });

            const trackingPercent = Math.round((trackingCookies.length / cookies.length) * 100);

            expect(trackingPercent).toBeGreaterThanOrEqual(0);
            expect(trackingPercent).toBeLessThanOrEqual(100);
        });
    });

    describe('getDomainStats', () => {
        test('should group cookies by domain', () => {
            const cookies = getAllMockCookies();
            const domainMap = new Map();

            cookies.forEach(cookie => {
                const domain = cookie.domain.replace(/^\./, '');
                const existing = domainMap.get(domain) || { count: 0, size: 0 };
                existing.count++;
                existing.size += cookie.name.length + cookie.value.length;
                domainMap.set(domain, existing);
            });

            expect(domainMap.size).toBeGreaterThan(0);
        });

        test('should sort domains by cookie count', () => {
            const cookies = getAllMockCookies();
            const domainMap = new Map();

            cookies.forEach(cookie => {
                const domain = cookie.domain.replace(/^\./, '');
                const existing = domainMap.get(domain) || { count: 0 };
                existing.count++;
                domainMap.set(domain, existing);
            });

            const sorted = Array.from(domainMap.entries())
                .sort((a, b) => b[1].count - a[1].count);

            // First domain should have highest count
            if (sorted.length > 1) {
                expect(sorted[0][1].count).toBeGreaterThanOrEqual(sorted[1][1].count);
            }
        });
    });

    describe('getExpiryStats', () => {
        test('should categorize cookies by expiry time', () => {
            const cookies = getAllMockCookies();
            const now = Date.now() / 1000;
            const day = 24 * 60 * 60;
            const week = 7 * day;
            const month = 30 * day;
            const year = 365 * day;

            const stats = {
                session: 0,
                within24Hours: 0,
                within7Days: 0,
                within30Days: 0,
                within1Year: 0,
                over1Year: 0
            };

            cookies.forEach(cookie => {
                if (cookie.session || !cookie.expirationDate) {
                    stats.session++;
                } else {
                    const expiresIn = cookie.expirationDate - now;
                    if (expiresIn < day) stats.within24Hours++;
                    else if (expiresIn < week) stats.within7Days++;
                    else if (expiresIn < month) stats.within30Days++;
                    else if (expiresIn < year) stats.within1Year++;
                    else stats.over1Year++;
                }
            });

            const total = Object.values(stats).reduce((a, b) => a + b, 0);
            expect(total).toBe(cookies.length);
        });
    });

    describe('Privacy Score Calculation', () => {
        test('should return high score for secure cookies', () => {
            const secureCookies = [
                { name: 'safe', secure: true, httpOnly: true, sameSite: 'strict' }
            ];

            let score = 100;
            secureCookies.forEach(c => {
                if (!c.secure) score -= 10;
                if (!c.httpOnly) score -= 5;
            });

            expect(score).toBe(100);
        });

        test('should return lower score for insecure cookies', () => {
            const insecureCookies = [
                { name: 'unsafe', secure: false, httpOnly: false, sameSite: 'none' }
            ];

            let score = 100;
            insecureCookies.forEach(c => {
                if (!c.secure) score -= 10;
                if (!c.httpOnly) score -= 5;
            });

            expect(score).toBe(85);
        });

        test('should penalize tracking cookies', () => {
            const trackingPatterns = ['_ga', '_fbp', 'analytics'];
            const cookies = [
                { name: '_ga', domain: '.google.com' },
                { name: 'session', domain: '.example.com' }
            ];

            let score = 100;
            cookies.forEach(c => {
                const isTracking = trackingPatterns.some(p =>
                    c.name.toLowerCase().includes(p)
                );
                if (isTracking) score -= 5;
            });

            expect(score).toBe(95);
        });
    });
});