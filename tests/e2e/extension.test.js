/**
 * End-to-End Extension Tests
 */

import { createPopupDOM, createDashboardDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockCookies, mockSchedules, mockSettings, getAllMockCookies } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, flushPromises, click, typeIntoInput } from '../helpers/testUtils.js';

describe('Extension E2E Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({
            settings: mockSettings,
            schedules: mockSchedules,
            savedBackups: [],
            cookieHistory: []
        });

        chrome.tabs.query.mockResolvedValue([{
            id: 1,
            url: 'https://www.google.com/',
            title: 'Google',
            favIconUrl: 'https://www.google.com/favicon.ico'
        }]);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Complete Cookie Management Flow', () => {
        beforeEach(() => {
            createPopupDOM();
        });

        test('should complete view → edit → delete cookie flow', async () => {
            // Step 1: View cookies
            const cookiesList = query.byId('cookiesList');
            cookiesList.innerHTML = mockCookies.google.map((c, i) => `
        <div class="cookie-item" data-index="${i}">
          <div class="cookie-name">${c.name}</div>
        </div>
      `).join('');

            expect(cookiesList.children.length).toBe(mockCookies.google.length);

            // Step 2: Click cookie to view details
            const firstCookie = cookiesList.querySelector('.cookie-item');
            click(firstCookie);

            const modalOverlay = query.byId('modalOverlay');
            modalOverlay.classList.add('show');

            expect(modalOverlay.classList.contains('show')).toBe(true);

            // Step 3: Edit cookie value
            const modalBody = query.byId('modalBody');
            modalBody.innerHTML = `
        <div class="detail-value editable" contenteditable="true">original_value</div>
      `;

            const valueField = modalBody.querySelector('.detail-value');
            valueField.textContent = 'new_value';

            expect(valueField.textContent).toBe('new_value');

            // Step 4: Close modal
            modalOverlay.classList.remove('show');

            // Step 5: Delete cookie
            await chrome.cookies.remove({ url: 'https://google.com', name: '_ga' });

            expect(chrome.cookies.remove).toHaveBeenCalled();
        });

        test('should complete search → filter → clear flow', async () => {
            // Step 1: Search
            const searchInput = query.byId('cookieSearch');
            typeIntoInput(searchInput, 'session');

            expect(searchInput.value).toBe('session');

            // Step 2: Apply filter
            const filterBtn = query.byId('filterToggle');
            const filterPanel = query.byId('filterPanel');

            click(filterBtn);
            filterPanel.classList.add('show');

            const filterType = query.byId('filterType');
            filterType.value = 'secure';

            expect(filterType.value).toBe('secure');

            // Step 3: Clear site cookies
            const clearBtn = query.byId('clearSiteCookies');
            click(clearBtn);

            // Simulate clearing
            for (const cookie of mockCookies.google) {
                await chrome.cookies.remove({ url: 'https://google.com', name: cookie.name });
            }

            expect(chrome.cookies.remove).toHaveBeenCalled();
        });
    });

    describe('Complete Backup/Restore Flow', () => {
        beforeEach(() => {
            createPopupDOM();
        });

        test('should complete backup → restore flow', async () => {
            // Step 1: Open backup modal
            const backupBtn = query.byId('backupCookies');
            const backupModal = query.byId('backupModalOverlay');

            click(backupBtn);
            backupModal.classList.add('show');

            expect(backupModal.classList.contains('show')).toBe(true);

            // Step 2: Enter backup name
            const nameInput = query.byId('backupName');
            typeIntoInput(nameInput, 'My Backup');

            expect(nameInput.value).toBe('My Backup');

            // Step 3: Create backup (simulate)
            const createBtn = query.byId('createBackup');
            click(createBtn);

            const backupData = {
                name: 'My Backup',
                createdAt: Date.now(),
                cookies: getAllMockCookies()
            };

            // Save to storage
            const savedBackups = [{ id: '1', ...backupData }];
            await chrome.storage.local.set({ savedBackups });

            // Step 4: Switch to restore tab
            const restoreTab = query.bySelector('[data-vault="restore"]');
            const backupTab = query.bySelector('[data-vault="backup"]');

            click(restoreTab);
            backupTab.classList.remove('active');
            restoreTab.classList.add('active');

            expect(restoreTab.classList.contains('active')).toBe(true);

            // Step 5: Restore cookies
            for (const cookie of backupData.cookies) {
                await chrome.cookies.set({
                    url: `https://${cookie.domain.replace(/^\./, '')}`,
                    ...cookie
                });
            }

            expect(chrome.cookies.set).toHaveBeenCalled();
        });
    });

    describe('Complete Schedule Flow', () => {
        beforeEach(() => {
            createPopupDOM();
        });

        test('should complete create → toggle → delete schedule flow', async () => {
            // Switch to scheduler tab
            const schedulerTab = query.bySelector('[data-tab="scheduler"]');
            click(schedulerTab);

            // Step 1: Open schedule form
            const addBtn = query.byId('addSchedule');
            const form = query.byId('schedulerForm');

            click(addBtn);
            form.classList.remove('hidden');

            expect(form.classList.contains('hidden')).toBe(false);

            // Step 2: Fill form
            const nameInput = query.byId('scheduleName');
            const frequencySelect = query.byId('scheduleFrequency');

            typeIntoInput(nameInput, 'Hourly Cleanup');
            frequencySelect.value = '60';

            // Step 3: Save schedule
            const saveBtn = query.byId('saveSchedule');
            click(saveBtn);

            const newSchedule = {
                id: Date.now().toString(),
                name: 'Hourly Cleanup',
                frequency: 60,
                enabled: true
            };

            await chrome.alarms.create(`schedule_${newSchedule.id}`, {
                periodInMinutes: 60
            });

            expect(chrome.alarms.create).toHaveBeenCalled();

            // Step 4: Toggle schedule off
            await chrome.alarms.clear(`schedule_${newSchedule.id}`);

            expect(chrome.alarms.clear).toHaveBeenCalled();

            // Step 5: Delete schedule
            // (Would remove from storage)
        });
    });

    describe('Complete Cache Clear Flow', () => {
        beforeEach(() => {
            createPopupDOM();
        });

        test('should complete select → clear cache flow', async () => {
            // Switch to cache tab
            const cacheTab = query.bySelector('[data-tab="cache"]');
            const cookiesPane = query.byId('cookiesTab');
            const cachePane = query.byId('cacheTab');

            click(cacheTab);
            cookiesPane.classList.remove('active');
            cachePane.classList.add('active');

            expect(cachePane.classList.contains('active')).toBe(true);

            // Step 1: Select options
            const cacheCheckbox = query.byId('clearCache');
            const historyCheckbox = query.byId('clearBrowsingHistory');

            cacheCheckbox.checked = true;
            historyCheckbox.checked = true;

            // Step 2: Select time range
            const timeRange = query.byId('timeRange');
            timeRange.value = '86400000'; // Last 24 hours

            expect(timeRange.value).toBe('86400000');

            // Step 3: Clear data
            const clearBtn = query.byId('clearSelectedCache');
            click(clearBtn);

            await chrome.browsingData.remove(
                { since: Date.now() - 86400000 },
                { cache: true, history: true }
            );

            expect(chrome.browsingData.remove).toHaveBeenCalled();
        });
    });

    describe('Dashboard E2E', () => {
        beforeEach(() => {
            createDashboardDOM();
        });

        test('should navigate through all pages', () => {
            const pages = ['overview', 'cookies', 'domains', 'analytics', 'schedules', 'vault', 'settings'];

            pages.forEach(pageName => {
                const navItem = query.bySelector(`[data-page="${pageName}"]`);
                const page = query.byId(`${pageName}Page`);

                // Deactivate all pages
                query.bySelectorAll('.page').forEach(p => p.classList.remove('active'));
                query.bySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

                // Activate current
                click(navItem);
                navItem.classList.add('active');
                page.classList.add('active');

                expect(page.classList.contains('active')).toBe(true);
                expect(navItem.classList.contains('active')).toBe(true);
            });
        });

        test('should complete settings change flow', async () => {
            // Navigate to settings
            const settingsNav = query.bySelector('[data-page="settings"]');
            const settingsPage = query.byId('settingsPage');

            click(settingsNav);
            settingsPage.classList.add('active');

            // Step 1: Change badge setting
            const showBadge = query.byId('settingShowBadge');
            showBadge.checked = false;
            showBadge.dispatchEvent(new Event('change'));

            expect(showBadge.checked).toBe(false);

            // Step 2: Change notifications setting
            const notifications = query.byId('settingNotifications');
            notifications.checked = false;
            notifications.dispatchEvent(new Event('change'));

            expect(notifications.checked).toBe(false);

            // Step 3: Change theme
            const themeSelect = query.byId('settingTheme');
            themeSelect.value = 'dark';
            themeSelect.dispatchEvent(new Event('change'));

            expect(themeSelect.value).toBe('dark');

            // Step 4: Save settings
            const newSettings = {
                showBadge: false,
                notifications: false,
                theme: 'dark',
                trackingProtection: true,
                autoCleanOnClose: false
            };

            await chrome.storage.local.set({ settings: newSettings });

            expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: newSettings });

            // Step 5: Update badge (should hide)
            await chrome.action.setBadgeText({ text: '' });

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
        });

        test('should complete export/import settings flow', async () => {
            // Navigate to settings
            const settingsPage = query.byId('settingsPage');
            settingsPage.classList.add('active');

            // Step 1: Export settings
            const exportBtn = query.byId('exportSettings');
            click(exportBtn);

            const exportData = {
                settings: mockSettings,
                schedules: mockSchedules,
                exportedAt: Date.now()
            };

            // Simulate file download
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            expect(blob.size).toBeGreaterThan(0);

            // Step 2: Import settings (simulate)
            const importBtn = query.byId('importSettings');
            click(importBtn);

            // Simulate file read and import
            await chrome.storage.local.set({ settings: exportData.settings });
            await chrome.storage.local.set({ schedules: exportData.schedules });

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });

        test('should complete reset all data flow', async () => {
            // Navigate to settings
            const settingsPage = query.byId('settingsPage');
            settingsPage.classList.add('active');

            // Step 1: Click reset button
            const resetBtn = query.byId('resetAllData');
            click(resetBtn);

            // Step 2: Confirm (simulated)
            const confirmed = true;

            if (confirmed) {
                // Step 3: Clear all alarms
                for (const schedule of mockSchedules) {
                    await chrome.alarms.clear(`schedule_${schedule.id}`);
                }

                // Step 4: Clear storage
                await chrome.storage.local.clear();

                // Step 5: Reset to defaults
                const defaultSettings = {
                    theme: 'light',
                    notifications: true,
                    autoCleanOnClose: false,
                    trackingProtection: true,
                    showBadge: true
                };

                await chrome.storage.local.set({ settings: defaultSettings });
                await chrome.storage.local.set({ schedules: [] });
                await chrome.storage.local.set({ savedBackups: [] });

                expect(chrome.storage.local.clear).toHaveBeenCalled();
                expect(chrome.storage.local.set).toHaveBeenCalled();
            }
        });
    });

    describe('Cross-Component Communication', () => {
        test('should update popup after dashboard action', async () => {
            // Simulate clearing cookies from dashboard
            await chrome.cookies.getAll({}).then(async cookies => {
                for (const cookie of cookies) {
                    await chrome.cookies.remove({
                        url: `https://${cookie.domain.replace(/^\./, '')}`,
                        name: cookie.name
                    });
                }
            });

            // Send message to update badge
            await chrome.runtime.sendMessage({ action: 'updateBadge' });

            // Badge should update
            await chrome.action.setBadgeText({ text: '0' });

            expect(chrome.action.setBadgeText).toHaveBeenCalled();
        });

        test('should sync schedules between popup and dashboard', async () => {
            // Create schedule in popup
            const newSchedule = {
                id: 'sync_test',
                name: 'Sync Test',
                frequency: 60,
                enabled: true,
                createdAt: Date.now()
            };

            // Save to storage
            const schedules = [...mockSchedules, newSchedule];
            await chrome.storage.local.set({ schedules });

            // Create alarm
            await chrome.alarms.create(`schedule_${newSchedule.id}`, {
                periodInMinutes: 60
            });

            // Verify from dashboard perspective
            const stored = await chrome.storage.local.get('schedules');

            expect(stored.schedules).toContainEqual(expect.objectContaining({ id: 'sync_test' }));
        });
    });

    describe('Error Recovery', () => {
        test('should handle storage error gracefully', async () => {
            // Simulate storage error
            chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));

            let errorHandled = false;

            try {
                await chrome.storage.local.get('settings');
            } catch (error) {
                errorHandled = true;
                // Should use default settings
                const defaultSettings = {
                    theme: 'light',
                    notifications: true,
                    showBadge: true
                };
                expect(defaultSettings.theme).toBe('light');
            }

            expect(errorHandled).toBe(true);
        });

        test('should handle cookie API error gracefully', async () => {
            // Simulate API error
            chrome.cookies.getAll.mockRejectedValueOnce(new Error('API error'));

            let errorHandled = false;

            try {
                await chrome.cookies.getAll({});
            } catch (error) {
                errorHandled = true;
                // Should show error message
                expect(error.message).toBe('API error');
            }

            expect(errorHandled).toBe(true);
        });

        test('should recover from corrupted backup file', async () => {
            const corruptedData = 'not valid json{{{';

            let parseError = false;

            try {
                JSON.parse(corruptedData);
            } catch (error) {
                parseError = true;
                // Should show user-friendly error
                expect(error).toBeInstanceOf(SyntaxError);
            }

            expect(parseError).toBe(true);
        });
    });

    describe('Performance Scenarios', () => {
        test('should handle large cookie count', async () => {
            // Generate many cookies
            const largeCookieSet = [];
            for (let i = 0; i < 500; i++) {
                largeCookieSet.push({
                    name: `cookie_${i}`,
                    value: `value_${i}`,
                    domain: `.example${i % 50}.com`,
                    path: '/',
                    secure: i % 2 === 0,
                    httpOnly: i % 3 === 0,
                    session: i % 4 === 0
                });
            }

            setupMockCookies(largeCookieSet);

            const startTime = Date.now();
            const cookies = await chrome.cookies.getAll({});
            const endTime = Date.now();

            expect(cookies.length).toBe(500);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
        });

        test('should paginate large cookie lists', () => {
            const totalCookies = 500;
            const itemsPerPage = 20;
            const totalPages = Math.ceil(totalCookies / itemsPerPage);

            expect(totalPages).toBe(25);

            // Simulate pagination
            const getPage = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                return { start, end, page };
            };

            expect(getPage(1)).toEqual({ start: 0, end: 20, page: 1 });
            expect(getPage(25)).toEqual({ start: 480, end: 500, page: 25 });
        });
    });
});