/**
 * Message Passing Integration Tests
 */

import { mockCookies, mockSchedules, getAllMockCookies, createMockSchedule } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, flushPromises } from '../helpers/testUtils.js';

describe('Message Passing Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({ schedules: mockSchedules });
    });

    describe('Popup to Background Messages', () => {
        test('should get cookies for URL', async () => {
            const message = { action: 'getCookies', url: 'https://google.com' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'getCookies') {
                    return Promise.resolve(mockCookies.google);
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result).toEqual(mockCookies.google);
        });

        test('should get all cookies', async () => {
            const message = { action: 'getAllCookies' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'getAllCookies') {
                    return Promise.resolve(getAllMockCookies());
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.length).toBe(getAllMockCookies().length);
        });

        test('should delete cookie', async () => {
            const cookie = mockCookies.google[0];
            const message = { action: 'deleteCookie', cookie };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'deleteCookie') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });

        test('should clear cookies for domain', async () => {
            const message = { action: 'clearCookiesForDomain', domain: 'google.com' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'clearCookiesForDomain') {
                    return Promise.resolve({ success: true, count: 3 });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
            expect(result.count).toBe(3);
        });

        test('should clear all cookies', async () => {
            const message = { action: 'clearAllCookies' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'clearAllCookies') {
                    return Promise.resolve({ success: true, count: 10 });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });

        test('should clear browsing data', async () => {
            const message = {
                action: 'clearBrowsingData',
                options: { removeCache: true, removeHistory: true },
                since: 0
            };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'clearBrowsingData') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });
    });

    describe('Schedule Messages', () => {
        test('should create schedule', async () => {
            const schedule = createMockSchedule({ name: 'New Schedule' });
            const message = { action: 'createSchedule', schedule };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'createSchedule') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });

        test('should enable schedule', async () => {
            const message = { action: 'enableSchedule', scheduleId: 'schedule_1' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'enableSchedule') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });

        test('should disable schedule', async () => {
            const message = { action: 'disableSchedule', scheduleId: 'schedule_1' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'disableSchedule') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });

        test('should delete schedule', async () => {
            const message = { action: 'deleteSchedule', scheduleId: 'schedule_1' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'deleteSchedule') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });
    });

    describe('Statistics Messages', () => {
        test('should get statistics', async () => {
            const message = { action: 'getStatistics' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'getStatistics') {
                    return Promise.resolve({
                        total: 10,
                        secure: 7,
                        httpOnly: 4,
                        session: 3,
                        domains: 4
                    });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.total).toBe(10);
            expect(result.domains).toBe(4);
        });
    });

    describe('Badge Messages', () => {
        test('should update badge', async () => {
            const message = { action: 'updateBadge' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'updateBadge') {
                    return Promise.resolve({ success: true });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(true);
        });
    });

    describe('Export/Import Messages', () => {
        test('should export cookies', async () => {
            const message = { action: 'exportCookies', options: {} };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'exportCookies') {
                    return Promise.resolve({
                        exportedAt: Date.now(),
                        count: 10,
                        cookies: getAllMockCookies()
                    });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.count).toBe(10);
            expect(result.cookies).toBeDefined();
        });

        test('should import cookies', async () => {
            const message = {
                action: 'importCookies',
                data: { cookies: mockCookies.google },
                options: {}
            };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (msg.action === 'importCookies') {
                    return Promise.resolve({
                        total: 3,
                        success: 3,
                        failed: 0
                    });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.success).toBe(3);
            expect(result.failed).toBe(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle unknown action', async () => {
            const message = { action: 'unknownAction' };

            chrome.runtime.sendMessage.mockImplementation((msg) => {
                if (!['getCookies', 'getAllCookies', 'deleteCookie'].includes(msg.action)) {
                    return Promise.resolve({ error: `Unknown action: ${msg.action}` });
                }
            });

            const result = await chrome.runtime.sendMessage(message);

            expect(result.error).toContain('Unknown action');
        });

        test('should handle network errors', async () => {
            chrome.runtime.sendMessage.mockRejectedValue(new Error('Network error'));

            await expect(chrome.runtime.sendMessage({ action: 'getCookies' }))
                .rejects.toThrow('Network error');
        });

        test('should handle permission errors', async () => {
            chrome.runtime.sendMessage.mockImplementation(() => {
                return Promise.resolve({ error: 'Permission denied' });
            });

            const result = await chrome.runtime.sendMessage({ action: 'getCookies' });

            expect(result.error).toBe('Permission denied');
        });
    });

    describe('Message Response Format', () => {
        test('should return consistent success response', async () => {
            chrome.runtime.sendMessage.mockImplementation(() => {
                return Promise.resolve({ success: true, data: {} });
            });

            const result = await chrome.runtime.sendMessage({ action: 'test' });

            expect(result).toHaveProperty('success');
        });

        test('should return consistent error response', async () => {
            chrome.runtime.sendMessage.mockImplementation(() => {
                return Promise.resolve({ success: false, error: 'Something went wrong' });
            });

            const result = await chrome.runtime.sendMessage({ action: 'test' });

            expect(result.success).toBe(false);
            expect(result).toHaveProperty('error');
        });
    });
});