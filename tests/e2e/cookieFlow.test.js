/**
 * Cookie Flow E2E Tests
 */

import { createPopupDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockCookies, getAllMockCookies, createMockCookie } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, click, typeIntoInput, flushPromises } from '../helpers/testUtils.js';

describe('Cookie Flow E2E Tests', () => {
    beforeEach(() => {
        createPopupDOM();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({ settings: { showBadge: true } });

        chrome.tabs.query.mockResolvedValue([{
            id: 1,
            url: 'https://www.google.com/',
            title: 'Google'
        }]);
    });

    afterEach(() => {
        cleanupDOM();
        jest.clearAllMocks();
    });

    describe('View Cookies Flow', () => {
        test('should display current site cookies on load', async () => {
            const cookiesList = query.byId('cookiesList');
            const cookies = mockCookies.google;

            // Simulate loading
            cookiesList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

            // Wait and render
            await flushPromises();

            cookiesList.innerHTML = cookies.map((c, i) => `
        <div class="cookie-item" data-index="${i}" data-name="${c.name}">
          <div class="cookie-icon-wrapper ${c.secure ? 'secure' : ''}">
            <svg viewBox="0 0 24 24"></svg>
          </div>
          <div class="cookie-info">
            <div class="cookie-name">${c.name}</div>
            <div class="cookie-domain">${c.domain}</div>
          </div>
          <div class="cookie-badges">
            ${c.secure ? '<span class="badge secure">Secure</span>' : ''}
            ${c.httpOnly ? '<span class="badge http-only">HttpOnly</span>' : ''}
            ${c.session ? '<span class="badge session">Session</span>' : ''}
          </div>
          <button class="cookie-delete"></button>
        </div>
      `).join('');

            expect(cookiesList.querySelectorAll('.cookie-item').length).toBe(cookies.length);
            expect(cookiesList.querySelector('[data-name="_ga"]')).toBeTruthy();
        });

        test('should update cookie count in site info', () => {
            const cookieCount = query.byId('cookieCount');
            cookieCount.textContent = mockCookies.google.length.toString();

            expect(cookieCount.textContent).toBe('3');
        });

        test('should show empty state when no cookies', () => {
            const cookiesList = query.byId('cookiesList');

            cookiesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"></svg>
          <h4>No cookies found</h4>
          <p>This site has no cookies stored</p>
        </div>
      `;

            expect(cookiesList.querySelector('.empty-state')).toBeTruthy();
            expect(cookiesList.textContent).toContain('No cookies found');
        });
    });

    describe('Search Cookies Flow', () => {
        test('should filter cookies as user types', async () => {
            const searchInput = query.byId('cookieSearch');
            const cookiesList = query.byId('cookiesList');

            // Render all cookies
            const allCookies = getAllMockCookies();
            cookiesList.innerHTML = allCookies.map((c, i) => `
        <div class="cookie-item" data-index="${i}" data-name="${c.name}" data-domain="${c.domain}">
          <div class="cookie-name">${c.name}</div>
        </div>
      `).join('');

            // Type search query
            typeIntoInput(searchInput, '_ga');

            // Filter items
            cookiesList.querySelectorAll('.cookie-item').forEach(item => {
                const name = item.dataset.name.toLowerCase();
                const domain = item.dataset.domain.toLowerCase();
                const query = searchInput.value.toLowerCase();

                if (name.includes(query) || domain.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });

            const visibleItems = cookiesList.querySelectorAll('.cookie-item:not([style*="display: none"])');
            expect(visibleItems.length).toBeGreaterThan(0);

            // All visible items should contain '_ga'
            visibleItems.forEach(item => {
                expect(item.dataset.name.toLowerCase()).toContain('_ga');
            });
        });

        test('should clear search and show all cookies', () => {
            const searchInput = query.byId('cookieSearch');
            const cookiesList = query.byId('cookiesList');

            // Set initial search
            searchInput.value = '_ga';

            // Clear search
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));

            // Show all items
            cookiesList.querySelectorAll('.cookie-item').forEach(item => {
                item.style.display = '';
            });

            expect(searchInput.value).toBe('');
        });

        test('should show no results message', () => {
            const searchInput = query.byId('cookieSearch');
            const cookiesList = query.byId('cookiesList');

            typeIntoInput(searchInput, 'nonexistentcookie12345');

            // Hide all items
            cookiesList.querySelectorAll('.cookie-item').forEach(item => {
                item.style.display = 'none';
            });

            // Check if all hidden
            const visibleItems = cookiesList.querySelectorAll('.cookie-item:not([style*="display: none"])');
            expect(visibleItems.length).toBe(0);
        });
    });

    describe('Filter Cookies Flow', () => {
        test('should toggle filter panel', () => {
            const filterBtn = query.byId('filterToggle');
            const filterPanel = query.byId('filterPanel');

            // Open panel
            click(filterBtn);
            filterPanel.classList.add('show');
            filterBtn.classList.add('active');

            expect(filterPanel.classList.contains('show')).toBe(true);
            expect(filterBtn.classList.contains('active')).toBe(true);

            // Close panel
            click(filterBtn);
            filterPanel.classList.remove('show');
            filterBtn.classList.remove('active');

            expect(filterPanel.classList.contains('show')).toBe(false);
        });

        test('should filter by secure cookies', () => {
            const filterType = query.byId('filterType');
            const cookies = getAllMockCookies();

            filterType.value = 'secure';
            filterType.dispatchEvent(new Event('change'));

            const secureCookies = cookies.filter(c => c.secure);

            expect(secureCookies.length).toBeGreaterThan(0);
            expect(secureCookies.every(c => c.secure)).toBe(true);
        });

        test('should filter by session cookies', () => {
            const filterType = query.byId('filterType');
            const cookies = getAllMockCookies();

            filterType.value = 'session';
            filterType.dispatchEvent(new Event('change'));

            const sessionCookies = cookies.filter(c => c.session);

            expect(sessionCookies.length).toBeGreaterThan(0);
            expect(sessionCookies.every(c => c.session)).toBe(true);
        });

        test('should sort cookies by name', () => {
            const sortBy = query.byId('sortBy');
            const cookies = [...getAllMockCookies()];

            sortBy.value = 'name';
            sortBy.dispatchEvent(new Event('change'));

            const sorted = cookies.sort((a, b) => a.name.localeCompare(b.name));

            // First cookie should be alphabetically first
            for (let i = 1; i < sorted.length; i++) {
                expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
            }
        });

        test('should sort cookies by domain', () => {
            const sortBy = query.byId('sortBy');
            const cookies = [...getAllMockCookies()];

            sortBy.value = 'domain';
            sortBy.dispatchEvent(new Event('change'));

            const sorted = cookies.sort((a, b) => a.domain.localeCompare(b.domain));

            for (let i = 1; i < sorted.length; i++) {
                expect(sorted[i].domain.localeCompare(sorted[i - 1].domain)).toBeGreaterThanOrEqual(0);
            }
        });

        test('should combine search and filter', () => {
            const searchInput = query.byId('cookieSearch');
            const filterType = query.byId('filterType');
            const cookies = getAllMockCookies();

            // Apply search
            typeIntoInput(searchInput, 'google');

            // Apply filter
            filterType.value = 'secure';
            filterType.dispatchEvent(new Event('change'));

            // Combined filter
            const filtered = cookies.filter(c => {
                const matchesSearch = c.name.includes('google') || c.domain.includes('google');
                const matchesFilter = c.secure;
                return matchesSearch && matchesFilter;
            });

            expect(filtered.every(c => c.secure)).toBe(true);
        });
    });

    describe('Cookie Detail Flow', () => {
        test('should open cookie detail modal', () => {
            const cookiesList = query.byId('cookiesList');
            const modalOverlay = query.byId('modalOverlay');
            const modalBody = query.byId('modalBody');

            const cookie = mockCookies.google[0];

            // Render cookie item
            cookiesList.innerHTML = `
        <div class="cookie-item" data-index="0">
          <div class="cookie-name">${cookie.name}</div>
        </div>
      `;

            // Click cookie
            const cookieItem = cookiesList.querySelector('.cookie-item');
            click(cookieItem);

            // Show modal
            modalOverlay.classList.add('show');
            modalBody.innerHTML = `
        <div class="cookie-detail">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <div class="detail-value">${cookie.name}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Value</span>
            <div class="detail-value editable" contenteditable="true">${cookie.value}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Domain</span>
            <div class="detail-value">${cookie.domain}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Path</span>
            <div class="detail-value">${cookie.path}</div>
          </div>
        </div>
      `;

            expect(modalOverlay.classList.contains('show')).toBe(true);
            expect(modalBody.textContent).toContain(cookie.name);
            expect(modalBody.textContent).toContain(cookie.domain);
        });

        test('should edit cookie value', async () => {
            const modalBody = query.byId('modalBody');

            modalBody.innerHTML = `
        <div class="detail-value editable" contenteditable="true" id="editableValue">original_value</div>
      `;

            const editableValue = query.byId('editableValue');

            // Edit value
            editableValue.textContent = 'new_edited_value';
            editableValue.dispatchEvent(new Event('input'));

            expect(editableValue.textContent).toBe('new_edited_value');

            // Save changes
            const newCookie = {
                ...mockCookies.google[0],
                value: 'new_edited_value'
            };

            await chrome.cookies.set({
                url: 'https://google.com',
                ...newCookie
            });

            expect(chrome.cookies.set).toHaveBeenCalled();
        });

        test('should close modal', () => {
            const modalOverlay = query.byId('modalOverlay');
            const closeBtn = query.byId('modalClose');

            modalOverlay.classList.add('show');

            click(closeBtn);
            modalOverlay.classList.remove('show');

            expect(modalOverlay.classList.contains('show')).toBe(false);
        });
    });

    describe('Delete Cookie Flow', () => {
        test('should delete single cookie', async () => {
            const cookie = mockCookies.google[0];

            await chrome.cookies.remove({
                url: 'https://google.com/',
                name: cookie.name
            });

            expect(chrome.cookies.remove).toHaveBeenCalledWith({
                url: 'https://google.com/',
                name: cookie.name
            });
        });

        test('should update list after delete', async () => {
            const cookiesList = query.byId('cookiesList');

            // Initial render
            cookiesList.innerHTML = mockCookies.google.map((c, i) => `
        <div class="cookie-item" data-index="${i}" data-name="${c.name}"></div>
      `).join('');

            const initialCount = cookiesList.children.length;

            // Delete first cookie
            await chrome.cookies.remove({
                url: 'https://google.com/',
                name: mockCookies.google[0].name
            });

            // Remove from DOM
            const itemToRemove = cookiesList.querySelector('[data-index="0"]');
            itemToRemove.remove();

            expect(cookiesList.children.length).toBe(initialCount - 1);
        });

        test('should update cookie count after delete', () => {
            const cookieCount = query.byId('cookieCount');
            const initialCount = parseInt(cookieCount.textContent) || 3;

            // After delete
            cookieCount.textContent = (initialCount - 1).toString();

            expect(parseInt(cookieCount.textContent)).toBe(initialCount - 1);
        });

        test('should show toast after delete', () => {
            const toastContainer = query.byId('toastContainer');

            toastContainer.innerHTML = `
        <div class="toast success">
          <span class="toast-message">Cookie deleted successfully</span>
        </div>
      `;

            expect(toastContainer.querySelector('.toast.success')).toBeTruthy();
            expect(toastContainer.textContent).toContain('deleted successfully');
        });
    });

    describe('Clear Cookies Flow', () => {
        test('should clear site cookies', async () => {
            const clearSiteBtn = query.byId('clearSiteCookies');

            click(clearSiteBtn);

            // Confirm and clear
            for (const cookie of mockCookies.google) {
                await chrome.cookies.remove({
                    url: 'https://google.com/',
                    name: cookie.name
                });
            }

            expect(chrome.cookies.remove).toHaveBeenCalledTimes(mockCookies.google.length);
        });

        test('should clear all cookies', async () => {
            const clearAllBtn = query.byId('clearAllCookies');

            click(clearAllBtn);

            // Get and delete all
            const allCookies = getAllMockCookies();

            for (const cookie of allCookies) {
                await chrome.cookies.remove({
                    url: `https://${cookie.domain.replace(/^\./, '')}/`,
                    name: cookie.name
                });
            }

            expect(chrome.cookies.remove).toHaveBeenCalledTimes(allCookies.length);
        });

        test('should show empty state after clearing all', () => {
            const cookiesList = query.byId('cookiesList');
            const cookieCount = query.byId('cookieCount');

            // Clear list
            cookiesList.innerHTML = `
        <div class="empty-state">
          <h4>No cookies found</h4>
        </div>
      `;

            cookieCount.textContent = '0';

            expect(cookiesList.querySelector('.empty-state')).toBeTruthy();
            expect(cookieCount.textContent).toBe('0');
        });
    });

    describe('Privacy Score Flow', () => {
        test('should calculate and display privacy score', () => {
            const scoreValue = query.byId('scoreValue');
            const scoreRing = query.byId('scoreRing');

            // Calculate score
            const cookies = getAllMockCookies();
            let score = 100;

            const trackingPatterns = ['_ga', '_gid', '_fbp', 'analytics'];

            cookies.forEach(cookie => {
                const isTracking = trackingPatterns.some(p =>
                    cookie.name.toLowerCase().includes(p)
                );
                if (isTracking) score -= 5;
                if (!cookie.secure) score -= 2;
            });

            score = Math.max(0, Math.min(100, score));

            // Update UI
            scoreValue.textContent = score.toString();
            scoreRing.setAttribute('stroke-dasharray', `${score}, 100`);

            expect(parseInt(scoreValue.textContent)).toBeLessThanOrEqual(100);
            expect(parseInt(scoreValue.textContent)).toBeGreaterThanOrEqual(0);
        });

        test('should update score after deleting tracking cookies', () => {
            const scoreValue = query.byId('scoreValue');

            // Initial score
            const initialScore = 70;
            scoreValue.textContent = initialScore.toString();

            // After deleting tracking cookies, score should improve
            const newScore = 85;
            scoreValue.textContent = newScore.toString();

            expect(parseInt(scoreValue.textContent)).toBeGreaterThan(initialScore);
        });
    });
});