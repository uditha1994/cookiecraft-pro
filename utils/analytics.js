// ========================================
// Analytics Utility
// ========================================

import { CookieManager } from './cookieManager.js';
import { StorageManager } from './storageManager.js';

const cookieManager = new CookieManager();
const storageManager = new StorageManager();

/**
 * Get comprehensive analytics data
 */
export async function getAnalytics() {
    const cookies = await cookieManager.getAllCookies();

    return {
        overview: getOverviewStats(cookies),
        security: getSecurityStats(cookies),
        tracking: await getTrackingStats(cookies),
        domains: getDomainStats(cookies),
        expiry: getExpiryStats(cookies),
        timeline: await getTimelineData()
    };
}

/**
 * Get overview statistics
 */
function getOverviewStats(cookies) {
    const totalSize = cookies.reduce((acc, c) => acc + c.name.length + c.value.length, 0);
    const domains = new Set(cookies.map(c => c.domain));

    return {
        totalCookies: cookies.length,
        totalDomains: domains.size,
        totalSize,
        formattedSize: formatBytes(totalSize),
        sessionCookies: cookies.filter(c => c.session).length,
        persistentCookies: cookies.filter(c => !c.session).length
    };
}

/**
 * Get security statistics
 */
function getSecurityStats(cookies) {
    const secure = cookies.filter(c => c.secure).length;
    const httpOnly = cookies.filter(c => c.httpOnly).length;
    const sameSiteStrict = cookies.filter(c => c.sameSite === 'strict').length;
    const sameSiteLax = cookies.filter(c => c.sameSite === 'lax').length;
    const sameSiteNone = cookies.filter(c => c.sameSite === 'no_restriction').length;

    const securityScore = calculateSecurityScore(cookies);

    return {
        secure,
        securePercent: Math.round((secure / cookies.length) * 100) || 0,
        httpOnly,
        httpOnlyPercent: Math.round((httpOnly / cookies.length) * 100) || 0,
        sameSite: {
            strict: sameSiteStrict,
            lax: sameSiteLax,
            none: sameSiteNone
        },
        securityScore
    };
}

/**
 * Calculate security score
 */
function calculateSecurityScore(cookies) {
    if (cookies.length === 0) return 100;

    let score = 100;

    cookies.forEach(cookie => {
        if (!cookie.secure) score -= 0.5;
        if (!cookie.httpOnly) score -= 0.3;
        if (cookie.sameSite === 'no_restriction') score -= 0.5;
    });

    return Math.max(0, Math.round(score));
}

/**
 * Get tracking cookie statistics
 */
async function getTrackingStats(cookies) {
    const trackingPatterns = {
        analytics: ['_ga', '_gid', '_gat', 'analytics', 'amplitude', 'mixpanel', 'segment'],
        advertising: ['_fbp', '_fbc', 'doubleclick', 'adsense', 'adwords', 'criteo', 'taboola', 'outbrain'],
        social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram'],
        session: ['session', 'sessionid', 'phpsessid', 'jsessionid', 'asp.net'],
        functional: ['preferences', 'settings', 'consent', 'gdpr']
    };

    const categorized = {
        analytics: [],
        advertising: [],
        social: [],
        session: [],
        functional: [],
        other: []
    };

    cookies.forEach(cookie => {
        const nameAndDomain = (cookie.name + cookie.domain).toLowerCase();
        let categorizedFlag = false;

        for (const [category, patterns] of Object.entries(trackingPatterns)) {
            if (patterns.some(p => nameAndDomain.includes(p))) {
                categorized[category].push(cookie);
                categorizedFlag = true;
                break;
            }
        }

        if (!categorizedFlag) {
            categorized.other.push(cookie);
        }
    });

    const trackingCookies = [
        ...categorized.analytics,
        ...categorized.advertising,
        ...categorized.social
    ];

    return {
        categories: {
            analytics: categorized.analytics.length,
            advertising: categorized.advertising.length,
            social: categorized.social.length,
            session: categorized.session.length,
            functional: categorized.functional.length,
            other: categorized.other.length
        },
        trackingCount: trackingCookies.length,
        trackingPercent: Math.round((trackingCookies.length / cookies.length) * 100) || 0,
        trackingCookies
    };
}

/**
 * Get domain statistics
 */
function getDomainStats(cookies) {
    const domainMap = new Map();

    cookies.forEach(cookie => {
        const domain = cookie.domain.replace(/^\./, '');
        const existing = domainMap.get(domain) || { count: 0, size: 0 };
        existing.count++;
        existing.size += cookie.name.length + cookie.value.length;
        domainMap.set(domain, existing);
    });

    const domains = Array.from(domainMap.entries())
        .map(([domain, stats]) => ({
            domain,
            count: stats.count,
            size: stats.size,
            formattedSize: formatBytes(stats.size)
        }))
        .sort((a, b) => b.count - a.count);

    return {
        topDomains: domains.slice(0, 10),
        allDomains: domains
    };
}

/**
 * Get expiry statistics
 */
function getExpiryStats(cookies) {
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

    return stats;
}

/**
 * Get timeline data (last 7 days of cookie activity)
 */
async function getTimelineData() {
    const history = await storageManager.get('cookieHistory') || [];
    const last7Days = history.slice(-7);

    return last7Days.map((day, index) => ({
        date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        count: day?.count || 0,
        added: day?.added || 0,
        removed: day?.removed || 0
    }));
}

/**
 * Record daily statistics
 */
export async function recordDailyStats() {
    const cookies = await cookieManager.getAllCookies();
    const today = new Date().toDateString();

    const history = await storageManager.get('cookieHistory') || [];
    const lastEntry = history[history.length - 1];

    if (lastEntry?.date === today) {
        lastEntry.count = cookies.length;
    } else {
        history.push({
            date: today,
            count: cookies.length,
            added: 0,
            removed: 0
        });
    }

    // Keep only last 30 days
    if (history.length > 30) {
        history.shift();
    }

    await storageManager.set('cookieHistory', history);
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}