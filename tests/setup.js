/**
 * Jest Setup File
 * Configures global mocks and test environment
 */

import '@testing-library/jest-dom';

// ========================================
// Chrome API Complete Mock
// ========================================

const createMockStorage = () => {
    let store = {};
    return {
        get: jest.fn((keys) => {
            if (typeof keys === 'string') {
                return Promise.resolve({ [keys]: store[keys] });
            }
            if (Array.isArray(keys)) {
                const result = {};
                keys.forEach(key => {
                    result[key] = store[key];
                });
                return Promise.resolve(result);
            }
            if (keys === null) {
                return Promise.resolve({ ...store });
            }
            return Promise.resolve({});
        }),
        set: jest.fn((items) => {
            Object.assign(store, items);
            return Promise.resolve();
        }),
        remove: jest.fn((keys) => {
            if (typeof keys === 'string') {
                delete store[keys];
            } else if (Array.isArray(keys)) {
                keys.forEach(key => delete store[key]);
            }
            return Promise.resolve();
        }),
        clear: jest.fn(() => {
            store = {};
            return Promise.resolve();
        }),
        getBytesInUse: jest.fn(() => Promise.resolve(JSON.stringify(store).length)),
        _getStore: () => store,
        _setStore: (newStore) => { store = newStore; }
    };
};

const createMockCookies = () => {
    let cookies = [];
    return {
        getAll: jest.fn((details) => {
            let filtered = [...cookies];
            if (details.url) {
                const url = new URL(details.url);
                filtered = filtered.filter(c =>
                    c.domain.includes(url.hostname) || url.hostname.includes(c.domain.replace(/^\./, ''))
                );
            }
            if (details.domain) {
                filtered = filtered.filter(c => c.domain.includes(details.domain));
            }
            if (details.name) {
                filtered = filtered.filter(c => c.name === details.name);
            }
            return Promise.resolve(filtered);
        }),
        get: jest.fn((details) => {
            const cookie = cookies.find(c =>
                c.name === details.name && c.url?.includes(details.url)
            );
            return Promise.resolve(cookie || null);
        }),
        set: jest.fn((details) => {
            const existingIndex = cookies.findIndex(c =>
                c.name === details.name && c.domain === details.domain
            );
            const newCookie = {
                name: details.name,
                value: details.value,
                domain: details.domain || new URL(details.url).hostname,
                path: details.path || '/',
                secure: details.secure || false,
                httpOnly: details.httpOnly || false,
                sameSite: details.sameSite || 'lax',
                expirationDate: details.expirationDate,
                session: !details.expirationDate
            };
            if (existingIndex >= 0) {
                cookies[existingIndex] = newCookie;
            } else {
                cookies.push(newCookie);
            }
            return Promise.resolve(newCookie);
        }),
        remove: jest.fn((details) => {
            const index = cookies.findIndex(c => c.name === details.name);
            if (index >= 0) {
                cookies.splice(index, 1);
                return Promise.resolve({ name: details.name, url: details.url });
            }
            return Promise.resolve(null);
        }),
        onChanged: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(() => false)
        },
        _getCookies: () => cookies,
        _setCookies: (newCookies) => { cookies = newCookies; },
        _addCookie: (cookie) => { cookies.push(cookie); },
        _clearCookies: () => { cookies = []; }
    };
};

const createMockAlarms = () => {
    let alarms = [];
    const listeners = [];

    return {
        create: jest.fn((name, alarmInfo) => {
            const alarm = {
                name,
                scheduledTime: Date.now() + (alarmInfo.delayInMinutes || 0) * 60000,
                periodInMinutes: alarmInfo.periodInMinutes
            };
            alarms.push(alarm);
            return Promise.resolve();
        }),
        get: jest.fn((name) => {
            const alarm = alarms.find(a => a.name === name);
            return Promise.resolve(alarm || null);
        }),
        getAll: jest.fn(() => Promise.resolve([...alarms])),
        clear: jest.fn((name) => {
            const index = alarms.findIndex(a => a.name === name);
            if (index >= 0) {
                alarms.splice(index, 1);
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }),
        clearAll: jest.fn(() => {
            alarms = [];
            return Promise.resolve();
        }),
        onAlarm: {
            addListener: jest.fn((callback) => {
                listeners.push(callback);
            }),
            removeListener: jest.fn(),
            hasListener: jest.fn(() => false)
        },
        _getAlarms: () => alarms,
        _triggerAlarm: (name) => {
            const alarm = alarms.find(a => a.name === name);
            if (alarm) {
                listeners.forEach(listener => listener(alarm));
            }
        }
    };
};

global.chrome = {
    cookies: createMockCookies(),

    storage: {
        local: createMockStorage(),
        sync: createMockStorage(),
        onChanged: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },

    browsingData: {
        remove: jest.fn(() => Promise.resolve()),
        removeCache: jest.fn(() => Promise.resolve()),
        removeCookies: jest.fn(() => Promise.resolve()),
        removeHistory: jest.fn(() => Promise.resolve()),
        removeLocalStorage: jest.fn(() => Promise.resolve()),
        removeDownloads: jest.fn(() => Promise.resolve()),
        removeFormData: jest.fn(() => Promise.resolve()),
        removePasswords: jest.fn(() => Promise.resolve()),
        settings: jest.fn(() => Promise.resolve({
            options: {
                originTypes: { unprotectedWeb: true }
            },
            dataToRemove: {
                cache: true,
                cookies: true
            }
        }))
    },

    alarms: createMockAlarms(),

    tabs: {
        query: jest.fn(() => Promise.resolve([
            {
                id: 1,
                url: 'https://www.example.com/page',
                title: 'Example Page',
                active: true,
                favIconUrl: 'https://www.example.com/favicon.ico'
            }
        ])),
        create: jest.fn((options) => Promise.resolve({ id: 2, ...options })),
        update: jest.fn(() => Promise.resolve()),
        remove: jest.fn(() => Promise.resolve()),
        get: jest.fn((tabId) => Promise.resolve({ id: tabId, url: 'https://example.com' })),
        onUpdated: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        onActivated: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        onRemoved: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },

    runtime: {
        sendMessage: jest.fn((message) => {
            return Promise.resolve({ success: true, data: message });
        }),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        onInstalled: {
            addListener: jest.fn()
        },
        onStartup: {
            addListener: jest.fn()
        },
        openOptionsPage: jest.fn(() => Promise.resolve()),
        getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
        getManifest: jest.fn(() => ({
            name: 'CookieMaster Pro',
            version: '1.0.0'
        })),
        id: 'mock-extension-id',
        lastError: null
    },

    action: {
        setBadgeText: jest.fn(() => Promise.resolve()),
        setBadgeBackgroundColor: jest.fn(() => Promise.resolve()),
        setBadgeTextColor: jest.fn(() => Promise.resolve()),
        setIcon: jest.fn(() => Promise.resolve()),
        setTitle: jest.fn(() => Promise.resolve()),
        openPopup: jest.fn(() => Promise.resolve())
    },

    contextMenus: {
        create: jest.fn((options, callback) => {
            if (callback) callback();
            return options.id;
        }),
        update: jest.fn(() => Promise.resolve()),
        remove: jest.fn(() => Promise.resolve()),
        removeAll: jest.fn((callback) => {
            if (callback) callback();
            return Promise.resolve();
        }),
        onClicked: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },

    notifications: {
        create: jest.fn((id, options, callback) => {
            if (callback) callback(id || 'notification-id');
            return Promise.resolve(id || 'notification-id');
        }),
        clear: jest.fn(() => Promise.resolve(true)),
        onClicked: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        onClosed: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },

    windows: {
        getAll: jest.fn(() => Promise.resolve([{ id: 1 }])),
        get: jest.fn((id) => Promise.resolve({ id })),
        create: jest.fn((options) => Promise.resolve({ id: 2, ...options })),
        update: jest.fn(() => Promise.resolve()),
        remove: jest.fn(() => Promise.resolve()),
        onRemoved: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },

    permissions: {
        contains: jest.fn(() => Promise.resolve(true)),
        request: jest.fn(() => Promise.resolve(true)),
        remove: jest.fn(() => Promise.resolve(true))
    }
};

// ========================================
// LocalStorage Mock
// ========================================

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn((index) => Object.keys(store)[index] || null),
        _getStore: () => store
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// ========================================
// Crypto Mock
// ========================================

const cryptoMock = {
    subtle: {
        importKey: jest.fn(() => Promise.resolve({ type: 'secret' })),
        deriveKey: jest.fn(() => Promise.resolve({ type: 'derived' })),
        encrypt: jest.fn((algorithm, key, data) => {
            // Simple mock encryption
            const encoded = new TextEncoder().encode(
                btoa(String.fromCharCode(...new Uint8Array(data)))
            );
            return Promise.resolve(encoded.buffer);
        }),
        decrypt: jest.fn((algorithm, key, data) => {
            // Simple mock decryption
            try {
                const decoded = atob(new TextDecoder().decode(new Uint8Array(data)));
                return Promise.resolve(new TextEncoder().encode(decoded).buffer);
            } catch {
                return Promise.reject(new Error('Decryption failed'));
            }
        }),
        digest: jest.fn((algorithm, data) => {
            // Simple mock hash
            const hash = new Uint8Array(32);
            for (let i = 0; i < hash.length; i++) {
                hash[i] = (data[i % data.length] || 0) ^ (i * 17);
            }
            return Promise.resolve(hash.buffer);
        }),
        generateKey: jest.fn(() => Promise.resolve({ type: 'generated' })),
        exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
        sign: jest.fn(() => Promise.resolve(new ArrayBuffer(64))),
        verify: jest.fn(() => Promise.resolve(true))
    },
    getRandomValues: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }),
    randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }))
};

Object.defineProperty(window, 'crypto', {
    value: cryptoMock
});

// global.crypto = cryptoMock;
Object.defineProperty(global, 'crypto', {
    value: cryptoMock,
    writable: true,
    configurable: true,
});

// ========================================
// URL Mock
// ========================================

global.URL = class URL {
    constructor(url, base) {
        const fullUrl = base ? new URL(url, base).href : url;
        const match = fullUrl.match(/^(https?):\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);

        if (!match) {
            throw new Error(`Invalid URL: ${url}`);
        }

        this.href = fullUrl;
        this.protocol = match[1] + ':';
        this.hostname = match[2].split(':')[0];
        this.port = match[2].split(':')[1] || '';
        this.host = match[2];
        this.pathname = match[3] || '/';
        this.search = match[4] || '';
        this.hash = match[5] || '';
        this.origin = `${this.protocol}//${this.host}`;
        this.searchParams = new URLSearchParams(this.search);
    }

    toString() {
        return this.href;
    }

    static createObjectURL = jest.fn(() => 'blob:mock-url');
    static revokeObjectURL = jest.fn();
};

// ========================================
// Blob Mock
// ========================================

global.Blob = class Blob {
    constructor(parts, options = {}) {
        this.parts = parts;
        this.type = options.type || '';
        this.size = parts.reduce((acc, part) => {
            if (typeof part === 'string') return acc + part.length;
            if (part instanceof ArrayBuffer) return acc + part.byteLength;
            return acc;
        }, 0);
    }

    text() {
        return Promise.resolve(this.parts.join(''));
    }

    arrayBuffer() {
        const text = this.parts.join('');
        const buffer = new ArrayBuffer(text.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < text.length; i++) {
            view[i] = text.charCodeAt(i);
        }
        return Promise.resolve(buffer);
    }
};

// ========================================
// FileReader Mock
// ========================================

global.FileReader = class FileReader {
    constructor() {
        this.result = null;
        this.error = null;
        this.readyState = 0;
        this.onload = null;
        this.onerror = null;
        this.onloadend = null;
    }

    readAsText(blob) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = blob.parts ? blob.parts.join('') : '';
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }

    readAsDataURL(blob) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = `data:${blob.type};base64,${btoa(blob.parts ? blob.parts.join('') : '')}`;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }

    readAsArrayBuffer(blob) {
        setTimeout(() => {
            this.readyState = 2;
            const text = blob.parts ? blob.parts.join('') : '';
            const buffer = new ArrayBuffer(text.length);
            const view = new Uint8Array(buffer);
            for (let i = 0; i < text.length; i++) {
                view[i] = text.charCodeAt(i);
            }
            this.result = buffer;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
        }, 0);
    }
};

// ========================================
// Canvas Mock
// ========================================

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    rect: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 10 })),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    clip: jest.fn(),
    canvas: { width: 100, height: 100 },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic'
}));

// ========================================
// Console Mock (Optional - to suppress logs during tests)
// ========================================

// Uncomment to suppress console during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   // Keep error for debugging
//   // error: jest.fn()
// };

// ========================================
// Utility Functions
// ========================================

global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.resetAllMocks = () => {
    jest.clearAllMocks();
    chrome.cookies._clearCookies();
    chrome.storage.local._setStore({});
    chrome.storage.sync._setStore({});
    localStorage.clear();
};

// ========================================
// Before/After Hooks
// ========================================

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});