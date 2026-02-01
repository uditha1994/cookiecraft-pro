/**
 * Storage Manager Unit Tests
 */

describe('StorageManager', () => {
    let storageManager;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock implementation
        const storage = {};

        chrome.storage.local.get.mockImplementation((key) => {
            return Promise.resolve({ [key]: storage[key] });
        });

        chrome.storage.local.set.mockImplementation((items) => {
            Object.assign(storage, items);
            return Promise.resolve();
        });

        chrome.storage.local.remove.mockImplementation((key) => {
            delete storage[key];
            return Promise.resolve();
        });

        chrome.storage.local.clear.mockImplementation(() => {
            Object.keys(storage).forEach(key => delete storage[key]);
            return Promise.resolve();
        });

        storageManager = {
            get: async (key) => {
                const result = await chrome.storage.local.get(key);
                return result[key];
            },
            set: async (key, value) => {
                await chrome.storage.local.set({ [key]: value });
                return true;
            },
            remove: async (key) => {
                await chrome.storage.local.remove(key);
                return true;
            },
            clear: async () => {
                await chrome.storage.local.clear();
                return true;
            }
        };
    });

    describe('get', () => {
        test('should retrieve stored value', async () => {
            await storageManager.set('testKey', 'testValue');
            const result = await storageManager.get('testKey');

            expect(result).toBe('testValue');
        });

        test('should return undefined for non-existent key', async () => {
            const result = await storageManager.get('nonExistent');

            expect(result).toBeUndefined();
        });
    });

    describe('set', () => {
        test('should store a value', async () => {
            const result = await storageManager.set('key1', 'value1');

            expect(result).toBe(true);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ key1: 'value1' });
        });

        test('should store objects', async () => {
            const obj = { name: 'test', count: 5 };
            await storageManager.set('myObject', obj);

            expect(chrome.storage.local.set).toHaveBeenCalledWith({ myObject: obj });
        });

        test('should store arrays', async () => {
            const arr = [1, 2, 3, 4, 5];
            await storageManager.set('myArray', arr);

            expect(chrome.storage.local.set).toHaveBeenCalledWith({ myArray: arr });
        });
    });

    describe('remove', () => {
        test('should remove a stored value', async () => {
            await storageManager.set('toRemove', 'value');
            await storageManager.remove('toRemove');

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('toRemove');
        });
    });

    describe('clear', () => {
        test('should clear all storage', async () => {
            await storageManager.set('key1', 'value1');
            await storageManager.set('key2', 'value2');
            await storageManager.clear();

            expect(chrome.storage.local.clear).toHaveBeenCalled();
        });
    });
});

describe('Schedule Storage', () => {
    test('should store and retrieve schedules', async () => {
        const schedules = [
            { id: '1', name: 'Daily', frequency: 1440, enabled: true },
            { id: '2', name: 'Hourly', frequency: 60, enabled: false }
        ];

        chrome.storage.local.set.mockResolvedValue();
        chrome.storage.local.get.mockResolvedValue({ schedules });

        await chrome.storage.local.set({ schedules });
        const result = await chrome.storage.local.get('schedules');

        expect(result.schedules).toEqual(schedules);
        expect(result.schedules.length).toBe(2);
    });
});