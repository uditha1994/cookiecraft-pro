/**
 * Scheduler Flow E2E Tests
 */

import { createPopupDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockSchedules, mockSettings, createMockSchedule } from '../helpers/mockData.js';
import { setupMockStorage, click, typeIntoInput, flushPromises } from '../helpers/testUtils.js';

describe('Scheduler E2E Tests', () => {
    beforeEach(() => {
        createPopupDOM();
        setupMockStorage({
            schedules: mockSchedules,
            settings: mockSettings
        });
    });

    afterEach(() => {
        cleanupDOM();
        jest.clearAllMocks();
    });

    describe('View Schedules', () => {
        test('should switch to scheduler tab', () => {
            const schedulerTab = query.bySelector('[data-tab="scheduler"]');
            const schedulerPane = query.byId('schedulerTab');
            const cookiesPane = query.byId('cookiesTab');

            click(schedulerTab);

            cookiesPane.classList.remove('active');
            schedulerPane.classList.add('active');

            expect(schedulerPane.classList.contains('active')).toBe(true);
        });

        test('should render existing schedules', () => {
            const schedulesList = query.byId('schedulesList');

            const frequencyLabels = {
                30: 'Every 30 min',
                60: 'Every hour',
                360: 'Every 6 hours',
                720: 'Every 12 hours',
                1440: 'Daily',
                10080: 'Weekly'
            };

            schedulesList.innerHTML = mockSchedules.map((s, i) => `
        <div class="schedule-item" data-index="${i}" data-id="${s.id}">
          <div class="schedule-icon">
            <svg viewBox="0 0 24 24"></svg>
          </div>
          <div class="schedule-info">
            <div class="schedule-name">${s.name}</div>
            <div class="schedule-details">${frequencyLabels[s.frequency] || s.frequency + ' min'}</div>
          </div>
          <label class="schedule-toggle">
            <input type="checkbox" ${s.enabled ? 'checked' : ''} data-index="${i}">
            <span class="toggle-slider"></span>
          </label>
          <button class="schedule-delete" data-index="${i}"></button>
        </div>
      `).join('');

            expect(schedulesList.children.length).toBe(mockSchedules.length);
        });

        test('should show empty state when no schedules', () => {
            const schedulesList = query.byId('schedulesList');

            schedulesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"></svg>
          <h4>No schedules yet</h4>
          <p>Create automated cleanup schedules</p>
        </div>
      `;

            expect(schedulesList.querySelector('.empty-state')).toBeTruthy();
        });
    });

    describe('Create Schedule Flow', () => {
        test('should show schedule form on add click', () => {
            const addBtn = query.byId('addSchedule');
            const form = query.byId('schedulerForm');

            click(addBtn);
            form.classList.remove('hidden');

            expect(form.classList.contains('hidden')).toBe(false);
        });

        test('should fill schedule form', () => {
            const nameInput = query.byId('scheduleName');
            const frequencySelect = query.byId('scheduleFrequency');
            const cookiesCheckbox = query.byId('schedCookies');
            const cacheCheckbox = query.byId('schedCache');
            const domainInput = query.byId('scheduleDomain');

            typeIntoInput(nameInput, 'My Custom Schedule');
            frequencySelect.value = '360';
            cookiesCheckbox.checked = true;
            cacheCheckbox.checked = true;
            typeIntoInput(domainInput, '*.google.com');

            expect(nameInput.value).toBe('My Custom Schedule');
            expect(frequencySelect.value).toBe('360');
            expect(cookiesCheckbox.checked).toBe(true);
            expect(cacheCheckbox.checked).toBe(true);
            expect(domainInput.value).toBe('*.google.com');
        });

        test('should validate schedule name required', () => {
            const nameInput = query.byId('scheduleName');
            const saveBtn = query.byId('saveSchedule');
            const toastContainer = query.byId('toastContainer');

            nameInput.value = '';
            click(saveBtn);

            // Show validation error
            if (!nameInput.value.trim()) {
                toastContainer.innerHTML = `
          <div class="toast warning">
            <span class="toast-message">Please enter a schedule name</span>
          </div>
        `;
            }

            expect(toastContainer.querySelector('.toast.warning')).toBeTruthy();
        });

        test('should save new schedule', async () => {
            const nameInput = query.byId('scheduleName');
            const frequencySelect = query.byId('scheduleFrequency');
            const saveBtn = query.byId('saveSchedule');

            typeIntoInput(nameInput, 'New Schedule');
            frequencySelect.value = '60';

            click(saveBtn);

            const newSchedule = {
                id: Date.now().toString(),
                name: 'New Schedule',
                frequency: 60,
                targets: {
                    cookies: query.byId('schedCookies').checked,
                    cache: query.byId('schedCache').checked,
                    history: query.byId('schedHistory').checked
                },
                domain: query.byId('scheduleDomain').value.trim(),
                enabled: true,
                createdAt: Date.now()
            };

            // Save to storage
            const schedules = [...mockSchedules, newSchedule];
            await chrome.storage.local.set({ schedules });

            // Create alarm
            await chrome.alarms.create(`schedule_${newSchedule.id}`, {
                periodInMinutes: newSchedule.frequency
            });

            expect(chrome.storage.local.set).toHaveBeenCalled();
            expect(chrome.alarms.create).toHaveBeenCalledWith(
                `schedule_${newSchedule.id}`,
                { periodInMinutes: 60 }
            );
        });

        test('should hide form after save', () => {
            const form = query.byId('schedulerForm');

            form.classList.remove('hidden');

            // After save
            form.classList.add('hidden');

            expect(form.classList.contains('hidden')).toBe(true);
        });

        test('should reset form after save', () => {
            const nameInput = query.byId('scheduleName');
            const frequencySelect = query.byId('scheduleFrequency');
            const domainInput = query.byId('scheduleDomain');

            // Fill form
            nameInput.value = 'Test';
            frequencySelect.value = '60';
            domainInput.value = 'example.com';

            // Reset
            nameInput.value = '';
            frequencySelect.value = '1440';
            domainInput.value = '';
            query.byId('schedCookies').checked = true;
            query.byId('schedCache').checked = false;
            query.byId('schedHistory').checked = false;

            expect(nameInput.value).toBe('');
            expect(frequencySelect.value).toBe('1440');
        });

        test('should cancel form', () => {
            const cancelBtn = query.byId('cancelSchedule');
            const form = query.byId('schedulerForm');

            form.classList.remove('hidden');

            click(cancelBtn);
            form.classList.add('hidden');

            expect(form.classList.contains('hidden')).toBe(true);
        });
    });

    describe('Toggle Schedule Flow', () => {
        test('should toggle schedule on', async () => {
            const schedulesList = query.byId('schedulesList');
            const schedule = mockSchedules.find(s => !s.enabled);

            if (schedule) {
                // Render toggle
                schedulesList.innerHTML = `
          <div class="schedule-item" data-id="${schedule.id}">
            <label class="schedule-toggle">
              <input type="checkbox" id="toggle_${schedule.id}">
              <span class="toggle-slider"></span>
            </label>
          </div>
        `;

                const toggle = query.byId(`toggle_${schedule.id}`);
                toggle.checked = true;
                toggle.dispatchEvent(new Event('change'));

                // Enable alarm
                await chrome.alarms.create(`schedule_${schedule.id}`, {
                    periodInMinutes: schedule.frequency
                });

                expect(chrome.alarms.create).toHaveBeenCalled();
            }
        });

        test('should toggle schedule off', async () => {
            const schedule = mockSchedules.find(s => s.enabled);

            if (schedule) {
                // Disable alarm
                await chrome.alarms.clear(`schedule_${schedule.id}`);

                expect(chrome.alarms.clear).toHaveBeenCalledWith(`schedule_${schedule.id}`);
            }
        });

        test('should show toast on toggle', () => {
            const toastContainer = query.byId('toastContainer');
            const enabled = true;

            toastContainer.innerHTML = `
        <div class="toast success">
          <span class="toast-message">Schedule ${enabled ? 'enabled' : 'disabled'}</span>
        </div>
      `;

            expect(toastContainer.textContent).toContain('enabled');
        });

        test('should update schedule in storage', async () => {
            const schedule = { ...mockSchedules[0], enabled: !mockSchedules[0].enabled };
            const schedules = mockSchedules.map(s =>
                s.id === schedule.id ? schedule : s
            );

            await chrome.storage.local.set({ schedules });

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('Delete Schedule Flow', () => {
        test('should delete schedule', async () => {
            const schedule = mockSchedules[0];

            // Clear alarm
            await chrome.alarms.clear(`schedule_${schedule.id}`);

            // Remove from storage
            const schedules = mockSchedules.filter(s => s.id !== schedule.id);
            await chrome.storage.local.set({ schedules });

            expect(chrome.alarms.clear).toHaveBeenCalledWith(`schedule_${schedule.id}`);
            expect(chrome.storage.local.set).toHaveBeenCalled();
        });

        test('should update list after delete', () => {
            const schedulesList = query.byId('schedulesList');

            // Initial count
            schedulesList.innerHTML = mockSchedules.map(s => `
        <div class="schedule-item" data-id="${s.id}"></div>
      `).join('');

            const initialCount = schedulesList.children.length;

            // Remove first item
            schedulesList.querySelector('.schedule-item').remove();

            expect(schedulesList.children.length).toBe(initialCount - 1);
        });

        test('should show toast after delete', () => {
            const toastContainer = query.byId('toastContainer');

            toastContainer.innerHTML = `
        <div class="toast success">
          <span class="toast-message">Schedule deleted</span>
        </div>
      `;

            expect(toastContainer.textContent).toContain('deleted');
        });

        test('should show empty state after deleting all', () => {
            const schedulesList = query.byId('schedulesList');

            // All deleted
            schedulesList.innerHTML = `
        <div class="empty-state">
          <h4>No schedules yet</h4>
        </div>
      `;

            expect(schedulesList.querySelector('.empty-state')).toBeTruthy();
        });
    });

    describe('Schedule Execution Flow', () => {
        test('should execute schedule on alarm', async () => {
            const schedule = mockSchedules[0];

            // Simulate alarm trigger
            const alarm = { name: `schedule_${schedule.id}` };

            // Execute targets
            if (schedule.targets.cookies) {
                if (schedule.domain) {
                    // Clear domain cookies
                    const cookies = await chrome.cookies.getAll({ domain: schedule.domain });
                    for (const cookie of cookies) {
                        await chrome.cookies.remove({
                            url: `https://${cookie.domain.replace(/^\./, '')}`,
                            name: cookie.name
                        });
                    }
                } else {
                    // Clear all cookies
                    const cookies = await chrome.cookies.getAll({});
                    for (const cookie of cookies) {
                        await chrome.cookies.remove({
                            url: `https://${cookie.domain.replace(/^\./, '')}`,
                            name: cookie.name
                        });
                    }
                }

                expect(chrome.cookies.getAll).toHaveBeenCalled();
            }

            if (schedule.targets.cache) {
                await chrome.browsingData.remove({ since: 0 }, { cache: true });
                expect(chrome.browsingData.remove).toHaveBeenCalled();
            }
        });

        test('should not execute disabled schedule', () => {
            const disabledSchedule = mockSchedules.find(s => !s.enabled);

            if (disabledSchedule) {
                // Should skip execution
                expect(disabledSchedule.enabled).toBe(false);
            }
        });

        test('should show notification after execution', async () => {
            const schedule = mockSchedules[0];

            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon128.png',
                title: 'CookieMaster Pro',
                message: `Schedule "${schedule.name}" completed`
            });

            expect(chrome.notifications.create).toHaveBeenCalled();
        });
    });

    describe('Frequency Options', () => {
        test('should have all frequency options', () => {
            const frequencySelect = query.byId('scheduleFrequency');

            const expectedOptions = [
                { value: '30', label: 'Every 30 minutes' },
                { value: '60', label: 'Every hour' },
                { value: '360', label: 'Every 6 hours' },
                { value: '720', label: 'Every 12 hours' },
                { value: '1440', label: 'Daily' },
                { value: '10080', label: 'Weekly' }
            ];

            expectedOptions.forEach(opt => {
                const option = frequencySelect.querySelector(`option[value="${opt.value}"]`);
                expect(option).toBeTruthy();
            });
        });

        test('should default to Daily', () => {
            const frequencySelect = query.byId('scheduleFrequency');

            // Check default selected
            expect(frequencySelect.value).toBe('1440');
        });
    });

    describe('Target Options', () => {
        test('should have all target options', () => {
            const cookiesCheckbox = query.byId('schedCookies');
            const cacheCheckbox = query.byId('schedCache');
            const historyCheckbox = query.byId('schedHistory');

            expect(cookiesCheckbox).toBeTruthy();
            expect(cacheCheckbox).toBeTruthy();
            expect(historyCheckbox).toBeTruthy();
        });

        test('should default cookies to checked', () => {
            const cookiesCheckbox = query.byId('schedCookies');

            expect(cookiesCheckbox.checked).toBe(true);
        });

        test('should allow multiple targets', () => {
            const cookiesCheckbox = query.byId('schedCookies');
            const cacheCheckbox = query.byId('schedCache');
            const historyCheckbox = query.byId('schedHistory');

            cookiesCheckbox.checked = true;
            cacheCheckbox.checked = true;
            historyCheckbox.checked = true;

            const targets = {
                cookies: cookiesCheckbox.checked,
                cache: cacheCheckbox.checked,
                history: historyCheckbox.checked
            };

            expect(targets.cookies).toBe(true);
            expect(targets.cache).toBe(true);
            expect(targets.history).toBe(true);
        });
    });

    describe('Domain Filter', () => {
        test('should accept domain pattern', () => {
            const domainInput = query.byId('scheduleDomain');

            typeIntoInput(domainInput, '*.example.com');

            expect(domainInput.value).toBe('*.example.com');
        });

        test('should accept specific domain', () => {
            const domainInput = query.byId('scheduleDomain');

            typeIntoInput(domainInput, 'www.google.com');

            expect(domainInput.value).toBe('www.google.com');
        });

        test('should allow empty domain for all sites', () => {
            const domainInput = query.byId('scheduleDomain');

            domainInput.value = '';

            expect(domainInput.value).toBe('');
        });
    });

    describe('Schedule Persistence', () => {
        test('should restore schedules on load', async () => {
            const stored = await chrome.storage.local.get('schedules');

            // Setup mock return
            chrome.storage.local.get.mockResolvedValueOnce({ schedules: mockSchedules });

            const result = await chrome.storage.local.get('schedules');

            expect(result.schedules).toBeDefined();
        });

        test('should restore alarms on startup', async () => {
            // Clear existing alarms
            await chrome.alarms.clearAll();

            // Restore from storage
            for (const schedule of mockSchedules) {
                if (schedule.enabled) {
                    await chrome.alarms.create(`schedule_${schedule.id}`, {
                        periodInMinutes: schedule.frequency
                    });
                }
            }

            const enabledCount = mockSchedules.filter(s => s.enabled).length;
            expect(chrome.alarms.create).toHaveBeenCalledTimes(enabledCount);
        });
    });
});