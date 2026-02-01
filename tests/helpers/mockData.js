/**
 * Mock Data for Testing
 */

export const mockCookies = {
    google: [
        {
            name: '_ga',
            value: 'GA1.2.1234567890.1234567890',
            domain: '.google.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400 * 365 * 2,
            session: false
        },
        {
            name: '_gid',
            value: 'GA1.2.0987654321.0987654321',
            domain: '.google.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400,
            session: false
        },
        {
            name: 'NID',
            value: '123=abcdefghijklmnop',
            domain: '.google.com',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'no_restriction',
            expirationDate: Date.now() / 1000 + 86400 * 180,
            session: false
        }
    ],

    github: [
        {
            name: '_gh_sess',
            value: 'session-token-here',
            domain: '.github.com',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            session: true
        },
        {
            name: 'logged_in',
            value: 'yes',
            domain: '.github.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400 * 14,
            session: false
        }
    ],

    example: [
        {
            name: 'session_id',
            value: 'abc123xyz',
            domain: '.example.com',
            path: '/',
            secure: false,
            httpOnly: false,
            sameSite: 'lax',
            session: true
        },
        {
            name: 'preferences',
            value: JSON.stringify({ theme: 'dark', lang: 'en' }),
            domain: '.example.com',
            path: '/',
            secure: false,
            httpOnly: false,
            sameSite: 'lax',
            expirationDate: Date.now() / 1000 + 86400 * 30,
            session: false
        }
    ],

    tracking: [
        {
            name: '_fbp',
            value: 'fb.1.1234567890.1234567890',
            domain: '.facebook.com',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'no_restriction',
            expirationDate: Date.now() / 1000 + 86400 * 90,
            session: false
        },
        {
            name: 'doubleclick_id',
            value: 'dc_12345',
            domain: '.doubleclick.net',
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'no_restriction',
            expirationDate: Date.now() / 1000 + 86400 * 365,
            session: false
        }
    ]
};

export const mockSchedules = [
    {
        id: 'schedule_1',
        name: 'Daily Cleanup',
        frequency: 1440,
        targets: {
            cookies: true,
            cache: true,
            history: false
        },
        domain: '',
        enabled: true,
        createdAt: Date.now() - 86400000
    },
    {
        id: 'schedule_2',
        name: 'Hourly Cache Clear',
        frequency: 60,
        targets: {
            cookies: false,
            cache: true,
            history: false
        },
        domain: '',
        enabled: true,
        createdAt: Date.now() - 172800000
    },
    {
        id: 'schedule_3',
        name: 'Google Cleanup',
        frequency: 720,
        targets: {
            cookies: true,
            cache: false,
            history: false
        },
        domain: '*.google.com',
        enabled: false,
        createdAt: Date.now() - 259200000
    }
];

export const mockSettings = {
    theme: 'light',
    notifications: true,
    autoCleanOnClose: false,
    trackingProtection: true,
    showBadge: true
};

export const mockBackup = {
    name: 'Test Backup',
    createdAt: Date.now(),
    version: '1.0',
    cookieCount: 5,
    cookies: [
        ...mockCookies.example,
        ...mockCookies.github.slice(0, 1)
    ]
};

export const mockEncryptedBackup = {
    name: 'Encrypted Backup',
    createdAt: Date.now(),
    encrypted: true,
    salt: 'bW9ja3NhbHQ=',
    iv: 'bW9ja2l2',
    data: 'ZW5jcnlwdGVkZGF0YQ=='
};

export const mockAnalytics = {
    overview: {
        totalCookies: 10,
        totalDomains: 4,
        totalSize: 2048,
        formattedSize: '2 KB',
        sessionCookies: 3,
        persistentCookies: 7
    },
    security: {
        secure: 7,
        securePercent: 70,
        httpOnly: 4,
        httpOnlyPercent: 40,
        sameSite: {
            strict: 0,
            lax: 6,
            none: 4
        },
        securityScore: 65
    },
    tracking: {
        categories: {
            analytics: 2,
            advertising: 1,
            social: 1,
            session: 3,
            functional: 1,
            other: 2
        },
        trackingCount: 4,
        trackingPercent: 40
    },
    domains: {
        topDomains: [
            { domain: 'google.com', count: 3, size: 512, formattedSize: '512 B' },
            { domain: 'github.com', count: 2, size: 256, formattedSize: '256 B' },
            { domain: 'example.com', count: 2, size: 128, formattedSize: '128 B' }
        ]
    },
    expiry: {
        session: 3,
        within24Hours: 1,
        within7Days: 0,
        within30Days: 2,
        within1Year: 2,
        over1Year: 2
    },
    timeline: [
        { date: 'Mon', count: 8, added: 2, removed: 0 },
        { date: 'Tue', count: 10, added: 3, removed: 1 },
        { date: 'Wed', count: 9, added: 0, removed: 1 },
        { date: 'Thu', count: 11, added: 2, removed: 0 },
        { date: 'Fri', count: 10, added: 1, removed: 2 },
        { date: 'Sat', count: 10, added: 0, removed: 0 },
        { date: 'Sun', count: 10, added: 0, removed: 0 }
    ]
};

export const mockTabs = [
    {
        id: 1,
        url: 'https://www.google.com/search?q=test',
        title: 'test - Google Search',
        active: true,
        favIconUrl: 'https://www.google.com/favicon.ico'
    },
    {
        id: 2,
        url: 'https://github.com/user/repo',
        title: 'user/repo - GitHub',
        active: false,
        favIconUrl: 'https://github.com/favicon.ico'
    },
    {
        id: 3,
        url: 'chrome://extensions/',
        title: 'Extensions',
        active: false,
        favIconUrl: ''
    }
];

export function getAllMockCookies() {
    return [
        ...mockCookies.google,
        ...mockCookies.github,
        ...mockCookies.example,
        ...mockCookies.tracking
    ];
}

export function createMockCookie(overrides = {}) {
    return {
        name: 'test_cookie',
        value: 'test_value',
        domain: '.example.com',
        path: '/',
        secure: false,
        httpOnly: false,
        sameSite: 'lax',
        session: true,
        ...overrides
    };
}

export function createMockSchedule(overrides = {}) {
    return {
        id: `schedule_${Date.now()}`,
        name: 'Test Schedule',
        frequency: 60,
        targets: {
            cookies: true,
            cache: false,
            history: false
        },
        domain: '',
        enabled: true,
        createdAt: Date.now(),
        ...overrides
    };
}