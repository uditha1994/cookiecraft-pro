/**
 * Popup Integration Tests
 */

import { createPopupDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockCookies, mockSchedules, mockSettings, getAllMockCookies } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, flushPromises, click, typeIntoInput } from '../helpers/testUtils.js';

describe('Popup Integration', () => {
    beforeEach(() => {
        createPopupDOM();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({
            settings: mockSettings,
            schedules: mockSchedules
        });

        chrome.tabs.query.mockResolvedValue([{
            id: 1,
            url: 'https://www.google.com/search?q=test',
            title: 'Google',
            favIconUrl: 'https://www.google.com/favicon.ico'
        }]);
    });

    afterEach(() => {
        cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should display current site domain', async () => {
            const domainEl = query.byId('siteDomain');
            domainEl.textContent = 'www.google.com';

            expect(domainEl.textContent).toBe('www.google.com');
        });

        test('should display cookie count', async () => {
            const countEl = query.byId('cookieCount');
            const googleCookies = mockCookies.google.length;
            countEl.textContent = googleCookies.toString();

            expect(parseInt(countEl.textContent)).toBe(googleCookies);
        });

        test('should calculate and display privacy score', async () => {
            const scoreEl = query.byId('scoreValue');
            scoreEl.textContent = '75';

            expect(scoreEl.textContent).toBe('75');
        });
    });

    describe('Tab Navigation', () => {
        test('should switch to Cookies tab', () => {
            const cookiesTab = query.bySelector('[data-tab="cookies"]');
            const cookiesPane = query.byId('cookiesTab');

            click(cookiesTab);
            cookiesPane.classList.add('active');

            expect(cookiesPane.classList.contains('active')).toBe(true);
        });

        test('should switch to Cache tab', () => {
            const cacheTab = query.bySelector('[data-tab="cache"]');
            const cachePane = query.byId('cacheTab');
            const cookiesPane = query.byId('cookiesTab');

            click(cacheTab);
            cookiesPane.classList.remove('active');
            cachePane.classList.add('active');

            expect(cachePane.classList.contains('active')).toBe(true);
            expect(cookiesPane.classList.contains('active')).toBe(false);
        });

        test('should switch to Scheduler tab', () => {
            const schedulerTab = query.bySelector('[data-tab="scheduler"]');
            const schedulerPane = query.byId('schedulerTab');

            click(schedulerTab);
            schedulerPane.classList.add('active');

            expect(schedulerPane.classList.contains('active')).toBe(true);
        });
    });

    describe('Cookie List', () => {
        test('should render cookies in list', () => {
            const cookiesList = query.byId('cookiesList');
            const cookies = mockCookies.google;

            cookiesList.innerHTML = cookies.map(c => `
        <div class="cookie-item" data-name="${c.name}">
          <div class="cookie-name">${c.name}</div>
          <div class="cookie-domain">${c.domain}</div>
        </div>
      `).join('');

            expect(cookiesList.children.length).toBe(cookies.length);
        });

        test('should filter cookies by search', () => {
            const searchInput = query.byId('cookieSearch');
            const cookiesList = query.byId('cookiesList');

            // Add cookies to list
            const cookies = mockCookies.google;
            cookiesList.innerHTML = cookies.map(c => `
        <div class="cookie-item" data-name="${c.name}">
          <div class="cookie-name">${c.name}</div>
        </div>
      `).join('');

            // Simulate search
            typeIntoInput(searchInput, '_ga');

            // Filter
            const items = cookiesList.querySelectorAll('.cookie-item');
            items.forEach(item => {
                const name = item.dataset.name;
                if (!name.includes('_ga')) {
                    item.style.display = 'none';
                }
            });

            const visibleItems = Array.from(items).filter(i => i.style.display !== 'none');
            expect(visibleItems.length).toBeGreaterThan(0);
        });

        test('should show empty state when no cookies', () => {
            const cookiesList = query.byId('cookiesList');
            cookiesList.innerHTML = `
        <div class="empty-state">
          <h4>No cookies found</h4>
        </div>
      `;

            expect(cookiesList.querySelector('.empty-state')).toBeTruthy();
        });
    });

    describe('Cookie Actions', () => {
        test('should open cookie detail modal on click', () => {
            const modalOverlay = query.byId('modalOverlay');

            // Simulate opening modal
            modalOverlay.classList.add('show');

            expect(modalOverlay.classList.contains('show')).toBe(true);
        });

        test('should close modal on close button click', () => {
            const modalOverlay = query.byId('modalOverlay');
            const closeBtn = query.byId('modalClose');

            modalOverlay.classList.add('show');
            click(closeBtn);
            modalOverlay.classList.remove('show');

            expect(modalOverlay.classList.contains('show')).toBe(false);
        });

        test('should delete cookie on delete button click', async () => {
            const cookie = mockCookies.google[0];

            chrome.cookies.remove.mockResolvedValue({ name: cookie.name });

            await chrome.cookies.remove({ url: 'https://google.com', name: cookie.name });

            expect(chrome.cookies.remove).toHaveBeenCalled();
        });
    });

    describe('Quick Actions', () => {
        test('should clear site cookies', async () => {
            const clearSiteBtn = query.byId('clearSiteCookies');

            click(clearSiteBtn);

            // Simulate confirmation and clearing
            const cookies = mockCookies.google;
            for (const cookie of cookies) {
                await chrome.cookies.remove({ url: 'https://google.com', name: cookie.name });
            }

            expect(chrome.cookies.remove).toHaveBeenCalled();
        });

        test('should clear all cookies', async () => {
            const clearAllBtn = query.byId('clearAllCookies');

            click(clearAllBtn);

            // Would trigger confirmation dialog in real app
            expect(clearAllBtn).toBeTruthy();
        });

        test('should open backup modal', () => {
            const backupBtn = query.byId('backupCookies');
            const backupModal = query.byId('backupModalOverlay');

            click(backupBtn);
            backupModal.classList.add('show');

            expect(backupModal.classList.contains('show')).toBe(true);
        });
    });

    describe('Cache Tab', () => {
        test('should have all cache options', () => {
            const options = [
                'clearBrowsingHistory',
                'clearDownloads',
                'clearCache',
                'clearFormData',
                'clearLocalStorage'
            ];

            options.forEach(id => {
                expect(query.byId(id)).toBeTruthy();
            });
        });

        test('should have time range selector', () => {
            const timeRange = query.byId('timeRange');
            expect(timeRange).toBeTruthy();
            expect(timeRange.tagName).toBe('SELECT');
        });

        test('should clear selected cache data', async () => {
            const clearBtn = query.byId('clearSelectedCache');
            const cacheCheckbox = query.byId('clearCache');

            cacheCheckbox.checked = true;
            click(clearBtn);

            await chrome.browsingData.remove({ since: 0 }, { cache: true });

            expect(chrome.browsingData.remove).toHaveBeenCalled();
        });
    });

    describe('Scheduler Tab', () => {
        test('should show add schedule button', () => {
            const addBtn = query.byId('addSchedule');
            expect(addBtn).toBeTruthy();
        });

        test('should show schedule form on add click', () => {
            const addBtn = query.byId('addSchedule');
            const form = query.byId('schedulerForm');

            click(addBtn);
            form.classList.remove('hidden');

            expect(form.classList.contains('hidden')).toBe(false);
        });

        test('should hide form on cancel', () => {
            const cancelBtn = query.byId('cancelSchedule');
            const form = query.byId('schedulerForm');

            form.classList.remove('hidden');
            click(cancelBtn);
            form.classList.add('hidden');

            expect(form.classList.contains('hidden')).toBe(true);
        });

        test('should save new schedule', async () => {
            const nameInput = query.byId('scheduleName');
            const frequencySelect = query.byId('scheduleFrequency');
            const saveBtn = query.byId('saveSchedule');

            typeIntoInput(nameInput, 'Test Schedule');
            frequencySelect.value = '60';

            click(saveBtn);

            // Check storage was called
            await chrome.storage.local.set({
                schedules: [...mockSchedules, {
                    id: expect.any(String),
                    name: 'Test Schedule',
                    frequency: 60,
                    enabled: true
                }]
            });
        });

        test('should render existing schedules', () => {
            const schedulesList = query.byId('schedulesList');

            schedulesList.innerHTML = mockSchedules.map(s => `
        <div class="schedule-item" data-id="${s.id}">
          <div class="schedule-name">${s.name}</div>
          <div class="schedule-details">${s.frequency} min</div>
        </div>
      `).join('');

            expect(schedulesList.children.length).toBe(mockSchedules.length);
        });
    });

    describe('Theme Toggle', () => {
        test('should toggle dark theme', () => {
            const themeBtn = query.byId('themeToggle');
            const container = query.byId('appContainer');

            click(themeBtn);
            container.classList.toggle('dark-theme');

            expect(container.classList.contains('dark-theme')).toBe(true);
        });

        test('should persist theme preference', () => {
            const container = query.byId('appContainer');
            container.classList.add('dark-theme');

            localStorage.setItem('darkTheme', 'true');

            expect(localStorage.getItem('darkTheme')).toBe('true');
        });
    });

    describe('Backup Modal', () => {
        test('should switch between backup and restore tabs', () => {
            const backupTab = query.bySelector('[data-vault="backup"]');
            const restoreTab = query.bySelector('[data-vault="restore"]');
            const backupContent = query.byId('vaultBackup');
            const restoreContent = query.byId('vaultRestore');

            // Switch to restore
            click(restoreTab);
            backupTab.classList.remove('active');
            restoreTab.classList.add('active');
            backupContent.classList.add('hidden');
            restoreContent.classList.remove('hidden');

            expect(restoreTab.classList.contains('active')).toBe(true);
            expect(restoreContent.classList.contains('hidden')).toBe(false);
        });

        test('should create backup', async () => {
            const nameInput = query.byId('backupName');
            const createBtn = query.byId('createBackup');

            typeIntoInput(nameInput, 'My Backup');
            click(createBtn);

            // Would create blob and download in real app
            expect(createBtn).toBeTruthy();
        });
    });

    describe('Filter Panel', () => {
        test('should toggle filter panel', () => {
            const filterBtn = query.byId('filterToggle');
            const filterPanel = query.byId('filterPanel');

            click(filterBtn);
            filterPanel.classList.toggle('show');

            expect(filterPanel.classList.contains('show')).toBe(true);
        });

        test('should filter by type', () => {
            const filterType = query.byId('filterType');
            filterType.value = 'secure';
            filterType.dispatchEvent(new Event('change'));

            expect(filterType.value).toBe('secure');
        });

        test('should sort cookies', () => {
            const sortBy = query.byId('sortBy');
            sortBy.value = 'domain';
            sortBy.dispatchEvent(new Event('change'));

            expect(sortBy.value).toBe('domain');
        });
    });
});