// Mock Chrome API
global.chrome = {
    cookies: {
        getAll: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        onChanged: {
            addListener: jest.fn()
        }
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn(),
            getBytesInUse: jest.fn()
        },
        sync: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        },
        onChanged: {
            addListener: jest.fn()
        }
    },
    browsingData: {
        remove: jest.fn(),
        removeCache: jest.fn(),
        removeCookies: jest.fn(),
        removeHistory: jest.fn(),
        removeLocalStorage: jest.fn()
    },
    alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        getAll: jest.fn(),
        onAlarm: {
            addListener: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        create: jest.fn(),
        onUpdated: {
            addListener: jest.fn()
        },
        onActivated: {
            addListener: jest.fn()
        }
    },
    runtime: {
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn()
        },
        onInstalled: {
            addListener: jest.fn()
        },
        onStartup: {
            addListener: jest.fn()
        },
        openOptionsPage: jest.fn()
    },
    action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
        setBadgeTextColor: jest.fn()
    },
    contextMenus: {
        create: jest.fn(),
        removeAll: jest.fn(),
        onClicked: {
            addListener: jest.fn()
        }
    },
    notifications: {
        create: jest.fn()
    },
    windows: {
        getAll: jest.fn(),
        onRemoved: {
            addListener: jest.fn()
        }
    }
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock crypto for encryption tests
global.crypto = {
    subtle: {
        importKey: jest.fn(),
        deriveKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        digest: jest.fn()
    },
    getRandomValues: jest.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    })
};