// ========================================
// Cookie Manager Utility
// ========================================

export class CookieManager {

    /**
     * Get all cookies for a specific URL
     */
    async getCookiesForUrl(url) {
        try {
            return await chrome.cookies.getAll({ url });
        } catch (error) {
            console.error('Error getting cookies for URL:', error);
            return [];
        }
    }

    /**
     * Get all cookies from all domains
     */
    async getAllCookies() {
        try {
            return await chrome.cookies.getAll({});
        } catch (error) {
            console.error('Error getting all cookies:', error);
            return [];
        }
    }

    /**
     * Get cookies by domain
     */
    async getCookiesByDomain(domain) {
        try {
            return await chrome.cookies.getAll({ domain });
        } catch (error) {
            console.error('Error getting cookies by domain:', error);
            return [];
        }
    }

    /**
     * Set/Create a cookie
     */
    async setCookie(cookieData) {
        const url = this.buildCookieUrl(cookieData);

        const cookieDetails = {
            url,
            name: cookieData.name,
            value: cookieData.value,
            domain: cookieData.domain,
            path: cookieData.path || '/',
            secure: cookieData.secure || false,
            httpOnly: cookieData.httpOnly || false,
            sameSite: cookieData.sameSite || 'lax'
        };

        if (cookieData.expirationDate) {
            cookieDetails.expirationDate = cookieData.expirationDate;
        }

        try {
            return await chrome.cookies.set(cookieDetails);
        } catch (error) {
            console.error('Error setting cookie:', error);
            throw error;
        }
    }

    /**
     * Update an existing cookie
     */
    async updateCookie(cookie, updates) {
        // Delete old cookie first
        await this.deleteCookie(cookie);

        // Create new cookie with updates
        const newCookie = { ...cookie, ...updates };
        return await this.setCookie(newCookie);
    }

    /**
     * Delete a specific cookie
     */
    async deleteCookie(cookie) {
        const url = this.buildCookieUrl(cookie);

        try {
            return await chrome.cookies.remove({
                url,
                name: cookie.name
            });
        } catch (error) {
            console.error('Error deleting cookie:', error);
            throw error;
        }
    }

    /**
     * Delete all cookies for a domain
     */
    async deleteCookiesForDomain(domain) {
        const cookies = await this.getCookiesByDomain(domain);
        const results = [];

        for (const cookie of cookies) {
            try {
                await this.deleteCookie(cookie);
                results.push({ success: true, cookie: cookie.name });
            } catch (error) {
                results.push({ success: false, cookie: cookie.name, error });
            }
        }

        return results;
    }

    /**
     * Clear all cookies
     */
    async clearAllCookies() {
        const cookies = await this.getAllCookies();
        let deleted = 0;

        for (const cookie of cookies) {
            try {
                await this.deleteCookie(cookie);
                deleted++;
            } catch (error) {
                console.warn('Failed to delete cookie:', cookie.name);
            }
        }

        return deleted;
    }

    /**
     * Search cookies with various criteria
     */
    async searchCookies(query, options = {}) {
        const allCookies = await this.getAllCookies();
        const queryLower = query.toLowerCase();

        return allCookies.filter(cookie => {
            // Text search
            const matchesQuery =
                cookie.name.toLowerCase().includes(queryLower) ||
                cookie.domain.toLowerCase().includes(queryLower) ||
                cookie.value.toLowerCase().includes(queryLower);

            if (!matchesQuery) return false;

            // Additional filters
            if (options.secure !== undefined && cookie.secure !== options.secure) {
                return false;
            }

            if (options.httpOnly !== undefined && cookie.httpOnly !== options.httpOnly) {
                return false;
            }

            if (options.session !== undefined && cookie.session !== options.session) {
                return false;
            }

            if (options.domain && !cookie.domain.includes(options.domain)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get cookie statistics
     */
    async getStatistics() {
        const cookies = await this.getAllCookies();

        const stats = {
            total: cookies.length,
            secure: 0,
            httpOnly: 0,
            session: 0,
            persistent: 0,
            thirdParty: 0,
            totalSize: 0,
            domains: new Set(),
            byDomain: {}
        };

        cookies.forEach(cookie => {
            stats.totalSize += cookie.name.length + cookie.value.length;
            stats.domains.add(cookie.domain);

            if (cookie.secure) stats.secure++;
            if (cookie.httpOnly) stats.httpOnly++;
            if (cookie.session) stats.session++;
            else stats.persistent++;

            // Count by domain
            if (!stats.byDomain[cookie.domain]) {
                stats.byDomain[cookie.domain] = 0;
            }
            stats.byDomain[cookie.domain]++;
        });

        stats.domainCount = stats.domains.size;
        stats.domains = Array.from(stats.domains);

        return stats;
    }

    /**
     * Build URL for cookie operations
     */
    buildCookieUrl(cookie) {
        const protocol = cookie.secure ? 'https' : 'http';
        const domain = cookie.domain.startsWith('.')
            ? cookie.domain.substring(1)
            : cookie.domain;
        return `${protocol}://${domain}${cookie.path || '/'}`;
    }

    /**
     * Export cookies to JSON
     */
    async exportCookies(options = {}) {
        let cookies;

        if (options.domain) {
            cookies = await this.getCookiesByDomain(options.domain);
        } else if (options.url) {
            cookies = await this.getCookiesForUrl(options.url);
        } else {
            cookies = await this.getAllCookies();
        }

        return {
            exportedAt: Date.now(),
            count: cookies.length,
            cookies: cookies.map(cookie => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                expirationDate: cookie.expirationDate,
                hostOnly: cookie.hostOnly,
                session: cookie.session
            }))
        };
    }

    /**
     * Import cookies from JSON
     */
    async importCookies(data, options = {}) {
        const results = {
            total: data.cookies.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (const cookie of data.cookies) {
            try {
                // Skip if domain filter is set and doesn't match
                if (options.domain && !cookie.domain.includes(options.domain)) {
                    continue;
                }

                await this.setCookie(cookie);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    cookie: cookie.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Find tracking cookies
     */
    async findTrackingCookies() {
        const trackingPatterns = [
            'analytics', 'tracking', '_ga', '_gid', 'fbp', 'fbm',
            'pixel', 'doubleclick', 'adsense', 'adwords', 'criteo',
            'outbrain', 'taboola', '_utm', 'visitor', 'session',
            'amplitude', 'mixpanel', 'segment', 'hotjar', 'clarity'
        ];

        const cookies = await this.getAllCookies();

        return cookies.filter(cookie => {
            const nameAndDomain = (cookie.name + cookie.domain).toLowerCase();
            return trackingPatterns.some(pattern => nameAndDomain.includes(pattern));
        });
    }

    /**
     * Get cookies expiring soon
     */
    async getExpiringCookies(days = 7) {
        const cookies = await this.getAllCookies();
        const threshold = Date.now() / 1000 + (days * 24 * 60 * 60);

        return cookies.filter(cookie => {
            return cookie.expirationDate &&
                cookie.expirationDate < threshold &&
                cookie.expirationDate > Date.now() / 1000;
        });
    }
}