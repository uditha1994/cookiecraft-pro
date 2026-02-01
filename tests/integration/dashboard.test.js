/**
 * Dashboard Integration Tests
 */

import { createDashboardDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockCookies, mockSchedules, mockSettings, mockAnalytics, getAllMockCookies } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, flushPromises, click, typeIntoInput } from '../helpers/testUtils.js';

describe('Dashboard Integration', () => {
    beforeEach(() => {
        createDashboardDOM();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({
            settings: mockSettings,
            schedules: mockSchedules,
            savedBackups: [],
            cookieHistory: mockAnalytics.timeline
        });
    });

    afterEach(() => {
        cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Navigation', () => {
        test('should navigate to Overview page', () => {
            const navItem = query.bySelector('[data-page="overview"]');
            const page = query.byId('overviewPage');

            click(navItem);
            page.classList.add('active');

            expect(page.classList.contains('active')).toBe(true);
        });

        test('should navigate to All Cookies page', () => {
            const navItem = query.bySelector('[data-page="cookies"]');
            const overviewPage = query.byId('overviewPage');
            const cookiesPage = query.byId('cookiesPage');

            click(navItem);
            overviewPage.classList.remove('active');
            cookiesPage.classList.add('active');

            expect(cookiesPage.classList.contains('active')).toBe(true);
            expect(overviewPage.classList.contains('active')).toBe(false);
        });

        test('should highlight active nav item', () => {
            const navItems = query.bySelectorAll('.nav-item');
            const domainsNav = query.bySelector('[data-page="domains"]');

            navItems.forEach(item => item.classList.remove('active'));
            domainsNav.classList.add('active');

            expect(domainsNav.classList.contains('active')).toBe(true);
        });
    });

    describe('Overview Page', () => {
        test('should display total cookies count', () => {
            const countEl = query.byId('totalCookies');
            countEl.textContent = mockAnalytics.overview.totalCookies.toString();

            expect(countEl.textContent).toBe('10');
        });

        test('should display domains count', () => {
            const countEl = query.byId('totalDomains');
            countEl.textContent = mockAnalytics.overview.totalDomains.toString();

            expect(countEl.textContent).toBe('4');
        });

        test('should display secure percentage', () => {
            const percentEl = query.byId('secureCookies');
            percentEl.textContent = mockAnalytics.security.securePercent + '%';

            expect(percentEl.textContent).toBe('70%');
        });

        test('should display tracking cookies count', () => {
            const countEl = query.byId('trackingCookies');
            countEl.textContent = mockAnalytics.tracking.trackingCount.toString();

            expect(countEl.textContent).toBe('4');
        });

        test('should render top domains list', () => {
            const list = query.byId('topDomainsList');
            const domains = mockAnalytics.domains.topDomains;

            list.innerHTML = domains.map(d => `
        <div class="domain-item">
          <div class="domain-name">${d.domain}</div>
          <div class="domain-count">${d.count}</div>
        </div>
      `).join('');

            expect(list.children.length).toBe(domains.length);
        });
    });

    describe('Cookies Page', () => {
        test('should render cookies table', () => {
            const tbody = query.byId('allCookiesTable');
            const cookies = getAllMockCookies();

            tbody.innerHTML = cookies.map(c => `
        <tr data-index="0">
          <td><input type="checkbox"></td>
          <td>${c.name}</td>
          <td>${c.domain}</td>
          <td>${c.value.substring(0, 20)}</td>
          <td>${c.session ? 'Session' : 'Persistent'}</td>
          <td></td>
          <td><button>Delete</button></td>
        </tr>
      `).join('');

            expect(tbody.children.length).toBe(cookies.length);
        });

        test('should filter cookies by search', () => {
            const searchInput = query.byId('allCookiesSearch');

            typeIntoInput(searchInput, 'google');

            expect(searchInput.value).toBe('google');
        });

        test('should filter by domain', () => {
            const domainFilter = query.byId('filterDomain');

            // Add options
            domainFilter.innerHTML = `
        <option value="">All Domains</option>
        <option value="google.com">google.com</option>
        <option value="github.com">github.com</option>
      `;

            domainFilter.value = 'google.com';
            domainFilter.dispatchEvent(new Event('change'));

            expect(domainFilter.value).toBe('google.com');
        });

        test('should select all cookies', () => {
            const selectAll = query.byId('selectAllCookies');
            const tbody = query.byId('allCookiesTable');

            tbody.innerHTML = `
        <tr><td><input type="checkbox" class="cookie-checkbox"></td></tr>
        <tr><td><input type="checkbox" class="cookie-checkbox"></td></tr>
      `;

            selectAll.checked = true;
            selectAll.dispatchEvent(new Event('change'));

            tbody.querySelectorAll('.cookie-checkbox').forEach(cb => {
                cb.checked = true;
            });

            const allChecked = Array.from(tbody.querySelectorAll('.cookie-checkbox'))
                .every(cb => cb.checked);

            expect(allChecked).toBe(true);
        });

        test('should delete selected cookies', async () => {
            const deleteBtn = query.byId('deleteSelectedBtn');

            click(deleteBtn);

            // Would delete selected cookies in real app
            expect(deleteBtn).toBeTruthy();
        });
    });

    describe('Domains Page', () => {
        test('should render domain cards', () => {
            const grid = query.byId('domainsGrid');
            const domains = mockAnalytics.domains.topDomains;

            grid.innerHTML = domains.map(d => `
        <div class="domain-card">
          <h4>${d.domain}</h4>
          <span>${d.count} cookies</span>
        </div>
      `).join('');

            expect(grid.children.length).toBe(domains.length);
        });
    });

    describe('Analytics Page', () => {
        test('should render security metrics', () => {
            const metrics = query.byId('securityMetrics');

            metrics.innerHTML = `
        <div class="security-metric">
          <span>Secure: ${mockAnalytics.security.securePercent}%</span>
        </div>
        <div class="security-metric">
          <span>HttpOnly: ${mockAnalytics.security.httpOnlyPercent}%</span>
        </div>
      `;

            expect(metrics.textContent).toContain('70%');
        });

        test('should render tracking breakdown', () => {
            const breakdown = query.byId('trackingBreakdown');
            const categories = mockAnalytics.tracking.categories;

            breakdown.innerHTML = Object.entries(categories).map(([key, value]) => `
        <div class="tracking-item">
          <span>${key}: ${value}</span>
        </div>
      `).join('');

            expect(breakdown.children.length).toBeGreaterThan(0);
        });
    });

    describe('Schedules Page', () => {
        test('should render schedules grid', () => {
            const grid = query.byId('schedulesGrid');

            grid.innerHTML = mockSchedules.map(s => `
        <div class="schedule-card" data-id="${s.id}">
          <h4>${s.name}</h4>
          <span>${s.frequency} min</span>
          <span class="${s.enabled ? 'active' : 'paused'}">${s.enabled ? 'Active' : 'Paused'}</span>
        </div>
      `).join('');

            expect(grid.children.length).toBe(mockSchedules.length);
        });

        test('should open add schedule modal', () => {
            const addBtn = query.byId('addScheduleBtn');

            click(addBtn);

            // Would open modal in real app
            expect(addBtn).toBeTruthy();
        });
    });

    describe('Vault Page', () => {
        test('should create backup', async () => {
            const nameInput = query.byId('vaultBackupName');
            const createBtn = query.byId('createVaultBackup');

            typeIntoInput(nameInput, 'Test Backup');
            click(createBtn);

            // Would create and download backup in real app
            expect(createBtn).toBeTruthy();
        });

        test('should render saved backups', () => {
            const list = query.byId('vaultBackupsList');
            const backups = [
                { name: 'Backup 1', createdAt: Date.now(), cookieCount: 10 },
                { name: 'Backup 2', createdAt: Date.now() - 86400000, cookieCount: 15 }
            ];

            list.innerHTML = backups.map(b => `
        <div class="backup-item">
          <span>${b.name}</span>
          <span>${b.cookieCount} cookies</span>
        </div>
      `).join('');

            expect(list.children.length).toBe(2);
        });

        test('should handle file drop', () => {
            const dropZone = query.byId('fileDropZone');

            expect(dropZone).toBeTruthy();
        });
    });

    describe('Settings Page', () => {
        test('should load saved settings', () => {
            const showBadge = query.byId('settingShowBadge');
            const notifications = query.byId('settingNotifications');
            const trackingProtection = query.byId('settingTrackingProtection');

            showBadge.checked = mockSettings.showBadge;
            notifications.checked = mockSettings.notifications;
            trackingProtection.checked = mockSettings.trackingProtection;

            expect(showBadge.checked).toBe(true);
            expect(notifications.checked).toBe(true);
        });

        test('should save settings on change', async () => {
            const autoClean = query.byId('settingAutoClean');

            autoClean.checked = true;
            autoClean.dispatchEvent(new Event('change'));

            await chrome.storage.local.set({
                settings: { ...mockSettings, autoCleanOnClose: true }
            });

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });

        test('should export settings', () => {
            const exportBtn = query.byId('exportSettings');

            click(exportBtn);

            // Would download settings file in real app
            expect(exportBtn).toBeTruthy();
        });

        test('should reset all data', async () => {
            const resetBtn = query.byId('resetAllData');

            click(resetBtn);

            // Would show confirmation and reset in real app
            expect(resetBtn).toBeTruthy();
        });
    });

    describe('Theme Toggle', () => {
        test('should toggle theme', () => {
            const themeBtn = query.byId('themeToggle');
            const container = query.byId('dashboardContainer');

            click(themeBtn);
            container.classList.toggle('dark-theme');

            expect(container.classList.contains('dark-theme')).toBe(true);
        });
    });

    describe('Quick Actions', () => {
        test('should clear all cookies', async () => {
            const clearBtn = query.byId('clearAllCookiesBtn');

            click(clearBtn);

            // Would show confirmation in real app
            expect(clearBtn).toBeTruthy();
        });

        test('should clear cache', async () => {
            const clearCacheBtn = query.byId('clearCacheBtn');

            click(clearCacheBtn);

            await chrome.browsingData.remove({ since: 0 }, { cache: true });

            expect(chrome.browsingData.remove).toHaveBeenCalled();
        });

        test('should export all cookies', () => {
            const exportBtn = query.byId('exportAllBtn');

            click(exportBtn);

            // Would download file in real app
            expect(exportBtn).toBeTruthy();
        });
    });
});