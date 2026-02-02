import { CookieManager } from '../utils/cookieManager.js';
import { CacheManager } from '../utils/cacheManager.js';
import { StorageManager } from '../utils/storageManager.js';
import { showToast } from '../components/toast.js';
import { drawDonutChart } from '../components/charts.js';

// Initialize managers
const cookieManager = new CookieManager();
const cacheManager = new CacheManager();
const storageManager = new StorageManager();

// State
let currentTab = null;
let currentCookies = [];
let schedules = [];

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    loadTheme();
});

async function initializeApp() {
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;

        // Update site info
        updateSiteInfo(tab);

        // Load cookies for current site
        await loadCookies();

        // Load schedules
        await loadSchedules();

        // Calculate privacy score
        calculatePrivacyScore();

        // Initialize cache chart
        initCacheChart();

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize', 'error');
    }
}

// ========================================
// Site Info
// ========================================

function updateSiteInfo(tab) {
    const url = new URL(tab.url);
    const domain = url.hostname;

    // Update domain display
    document.getElementById('siteDomain').textContent = domain;

    // Update favicon
    const faviconEl = document.getElementById('siteFavicon');
    if (tab.favIconUrl) {
        faviconEl.innerHTML = `<img src="${tab.favIconUrl}" alt="favicon">`;
    }
}

// ========================================
// Cookie Management
// ========================================

async function loadCookies() {
    const cookiesList = document.getElementById('cookiesList');

    try {
        const url = currentTab.url;
        currentCookies = await cookieManager.getCookiesForUrl(url);

        // Update cookie count
        document.getElementById('cookieCount').textContent = currentCookies.length;

        // Calculate storage size
        const totalSize = currentCookies.reduce((acc, cookie) => {
            return acc + (cookie.name.length + cookie.value.length);
        }, 0);
        document.getElementById('storageSize').textContent = formatBytes(totalSize);

        // Render cookies
        renderCookies(currentCookies);

    } catch (error) {
        console.error('Error loading cookies:', error);
        cookiesList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <h4>Cannot access cookies</h4>
        <p>This page doesn't allow cookie access</p>
      </div>
    `;
    }
}

function renderCookies(cookies) {
    const cookiesList = document.getElementById('cookiesList');

    if (cookies.length === 0) {
        cookiesList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
        <h4>No cookies found</h4>
        <p>This site has no cookies stored</p>
      </div>
    `;
        return;
    }

    cookiesList.innerHTML = cookies.map((cookie, index) => `
    <div class="cookie-item" data-index="${index}">
      <div class="cookie-icon-wrapper ${cookie.secure ? 'secure' : ''}">
        <svg viewBox="0 0 24 24">
          ${cookie.secure
            ? '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>'
            : '<circle cx="12" cy="12" r="10"/>'
        }
        </svg>
      </div>
      <div class="cookie-info">
        <div class="cookie-name">${escapeHtml(cookie.name)}</div>
        <div class="cookie-domain">${escapeHtml(cookie.domain)}</div>
      </div>
      <div class="cookie-badges">
        ${cookie.secure ? '<span class="badge secure">Secure</span>' : ''}
        ${cookie.httpOnly ? '<span class="badge http-only">HttpOnly</span>' : ''}
        ${cookie.session ? '<span class="badge session">Session</span>' : ''}
      </div>
      <button class="cookie-delete" data-index="${index}" title="Delete cookie">
        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </div>
  `).join('');

    // Add click handlers
    cookiesList.querySelectorAll('.cookie-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.cookie-delete')) {
                const index = parseInt(item.dataset.index);
                showCookieDetail(cookies[index]);
            }
        });
    });

    cookiesList.querySelectorAll('.cookie-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            await deleteCookie(cookies[index]);
        });
    });
}

function showCookieDetail(cookie) {
    const modal = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    const expiryDate = cookie.expirationDate
        ? new Date(cookie.expirationDate * 1000).toLocaleString()
        : 'Session';

    modalBody.innerHTML = `
    <div class="cookie-detail">
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <div class="detail-value">${escapeHtml(cookie.name)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Value</span>
        <div class="detail-value editable" contenteditable="true" id="cookieValue">${escapeHtml(cookie.value)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Domain</span>
        <div class="detail-value">${escapeHtml(cookie.domain)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Path</span>
        <div class="detail-value">${escapeHtml(cookie.path)}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Expires</span>
        <div class="detail-value">${expiryDate}</div>
      </div>
      <div class="detail-row">
        <span class="detail-label">Attributes</span>
        <div class="detail-value">
          ${cookie.secure ? '🔒 Secure ' : ''}
          ${cookie.httpOnly ? '🛡️ HttpOnly ' : ''}
          ${cookie.sameSite ? `📋 SameSite: ${cookie.sameSite}` : ''}
        </div>
      </div>
    </div>
  `;

    modalFooter.innerHTML = `
    <button class="btn secondary" id="modalCancel">Cancel</button>
    <button class="btn primary" id="modalSave">Save Changes</button>
  `;

    modal.classList.add('show');

    // Event handlers
    document.getElementById('modalCancel').addEventListener('click', () => {
        modal.classList.remove('show');
    });

    document.getElementById('modalSave').addEventListener('click', async () => {
        const newValue = document.getElementById('cookieValue').textContent;
        await updateCookie(cookie, newValue);
        modal.classList.remove('show');
    });
}

async function deleteCookie(cookie) {
    try {
        await cookieManager.deleteCookie(cookie);
        showToast('Cookie deleted successfully', 'success');
        await loadCookies();
        calculatePrivacyScore();
    } catch (error) {
        console.error('Error deleting cookie:', error);
        showToast('Failed to delete cookie', 'error');
    }
}

async function updateCookie(cookie, newValue) {
    try {
        await cookieManager.updateCookie(cookie, { value: newValue });
        showToast('Cookie updated successfully', 'success');
        await loadCookies();
    } catch (error) {
        console.error('Error updating cookie:', error);
        showToast('Failed to update cookie', 'error');
    }
}

// ========================================
// Privacy Score
// ========================================

function calculatePrivacyScore() {
    let score = 100;

    // Deduct points based on tracking cookies
    const trackingPatterns = [
        'analytics', 'tracking', 'pixel', 'facebook', 'google',
        'doubleclick', 'adsense', 'adwords', 'criteo', 'outbrain'
    ];

    currentCookies.forEach(cookie => {
        const cookieStr = (cookie.name + cookie.domain).toLowerCase();
        trackingPatterns.forEach(pattern => {
            if (cookieStr.includes(pattern)) {
                score -= 5;
            }
        });

        // Deduct for non-secure cookies
        if (!cookie.secure) {
            score -= 2;
        }

        // Deduct for long-lasting cookies
        if (cookie.expirationDate) {
            const daysUntilExpiry = (cookie.expirationDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysUntilExpiry > 365) {
                score -= 3;
            }
        }
    });

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Update UI
    const scoreRing = document.getElementById('scoreRing');
    const scoreValue = document.getElementById('scoreValue');

    scoreRing.style.strokeDasharray = `${score}, 100`;
    scoreValue.textContent = score;

    // Update color based on score
    if (score >= 70) {
        scoreRing.style.stroke = '#4CAF50';
    } else if (score >= 40) {
        scoreRing.style.stroke = '#FF9800';
    } else {
        scoreRing.style.stroke = '#F44336';
    }
}

// ========================================
// Cache Management
// ========================================

function initCacheChart() {
    const canvas = document.getElementById('cacheCanvas');
    const ctx = canvas.getContext('2d');

    // Sample data - in real implementation, get actual sizes
    const data = [
        { label: 'Cache', value: 45, color: '#FF9800' },
        { label: 'Cookies', value: 15, color: '#FF5722' },
        { label: 'Local Storage', value: 25, color: '#FFC107' },
        { label: 'Other', value: 15, color: '#FFE0B2' }
    ];

    drawDonutChart(ctx, data, canvas.width / 2, canvas.height / 2, 40, 15);

    // Render legend
    const legendContainer = document.getElementById('cacheLegend');
    legendContainer.innerHTML = data.map(item => `
    <div class="legend-item">
      <div class="legend-color" style="background: ${item.color}"></div>
      <span class="legend-label">${item.label}</span>
      <span class="legend-value">${item.value}%</span>
    </div>
  `).join('');
}

async function clearSelectedCache() {
    const options = {
        removeHistory: document.getElementById('clearBrowsingHistory')?.checked || false,
        removeDownloads: document.getElementById('clearDownloads')?.checked || false,
        removeCache: document.getElementById('clearCache')?.checked || false,
        removeFormData: document.getElementById('clearFormData')?.checked || false,
        removeLocalStorage: document.getElementById('clearLocalStorage')?.checked || false
    };

    // Check if at least one option is selected
    const hasSelection = Object.values(options).some(value => value === true);

    if (!hasSelection) {
        showToast('Please select at least one data type to clear', 'warning');
        return;
    }

    const timeRangeValue = parseInt(document.getElementById('timeRange')?.value || '0');

    // Calculate the 'since' timestamp
    // If timeRangeValue is 0, it means "All time" - clear everything
    // Otherwise, calculate the timestamp from which to start clearing
    let since = 0;
    if (timeRangeValue > 0) {
        since = Date.now() - timeRangeValue;
    }

    console.log('Clearing data with options:', options);
    console.log('Time range value:', timeRangeValue);
    console.log('Since timestamp:', since, '(', new Date(since).toLocaleString(), ')');

    try {
        await cacheManager.clearBrowsingData(options, since);

        // Build success message
        const clearedItems = [];
        if (options.removeHistory) clearedItems.push('browsing history');
        if (options.removeDownloads) clearedItems.push('download history');
        if (options.removeCache) clearedItems.push('cache');
        if (options.removeFormData) clearedItems.push('form data');
        if (options.removeLocalStorage) clearedItems.push('local storage');

        const message = `Cleared: ${clearedItems.join(', ')}`;
        showToast(message, 'success');

    } catch (error) {
        console.error('Error clearing cache:', error);
        showToast('Failed to clear browsing data', 'error');
    }
}

// ========================================
// Scheduler Management
// ========================================

async function loadSchedules() {
    schedules = await storageManager.get('schedules') || [];
    renderSchedules();
}

function renderSchedules() {
    const schedulesList = document.getElementById('schedulesList');

    if (schedules.length === 0) {
        schedulesList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
        <h4>No schedules yet</h4>
        <p>Create automated cleanup schedules</p>
      </div>
    `;
        return;
    }

    const frequencyLabels = {
        30: 'Every 30 min',
        60: 'Every hour',
        360: 'Every 6 hours',
        720: 'Every 12 hours',
        1440: 'Daily',
        10080: 'Weekly'
    };

    schedulesList.innerHTML = schedules.map((schedule, index) => `
    <div class="schedule-item" data-index="${index}">
      <div class="schedule-icon">
        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
      </div>
      <div class="schedule-info">
        <div class="schedule-name">${escapeHtml(schedule.name)}</div>
        <div class="schedule-details">${frequencyLabels[schedule.frequency] || schedule.frequency + ' min'}</div>
      </div>
      <label class="schedule-toggle">
        <input type="checkbox" ${schedule.enabled ? 'checked' : ''} data-index="${index}">
        <span class="toggle-slider"></span>
      </label>
      <button class="schedule-delete" data-index="${index}">
        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </div>
  `).join('');

    // Add event listeners
    schedulesList.querySelectorAll('.schedule-toggle input').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const index = parseInt(e.target.dataset.index);
            await toggleSchedule(index, e.target.checked);
        });
    });

    schedulesList.querySelectorAll('.schedule-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.closest('.schedule-delete').dataset.index);
            await deleteSchedule(index);
        });
    });
}

async function saveSchedule() {
    const name = document.getElementById('scheduleName').value.trim();
    const frequency = parseInt(document.getElementById('scheduleFrequency').value);
    const targets = {
        cookies: document.getElementById('schedCookies').checked,
        cache: document.getElementById('schedCache').checked,
        history: document.getElementById('schedHistory').checked
    };
    const domain = document.getElementById('scheduleDomain').value.trim();

    if (!name) {
        showToast('Please enter a schedule name', 'warning');
        return;
    }

    const schedule = {
        id: Date.now().toString(),
        name,
        frequency,
        targets,
        domain,
        enabled: true,
        createdAt: Date.now()
    };

    schedules.push(schedule);
    await storageManager.set('schedules', schedules);

    // Create alarm
    await chrome.runtime.sendMessage({
        action: 'createSchedule',
        schedule
    });

    showToast('Schedule created successfully', 'success');
    document.getElementById('schedulerForm').classList.add('hidden');
    renderSchedules();
    resetScheduleForm();
}

async function toggleSchedule(index, enabled) {
    schedules[index].enabled = enabled;
    await storageManager.set('schedules', schedules);

    await chrome.runtime.sendMessage({
        action: enabled ? 'enableSchedule' : 'disableSchedule',
        scheduleId: schedules[index].id
    });

    showToast(`Schedule ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

async function deleteSchedule(index) {
    const scheduleId = schedules[index].id;
    schedules.splice(index, 1);
    await storageManager.set('schedules', schedules);

    await chrome.runtime.sendMessage({
        action: 'deleteSchedule',
        scheduleId
    });

    showToast('Schedule deleted', 'success');
    renderSchedules();
}

function resetScheduleForm() {
    document.getElementById('scheduleName').value = '';
    document.getElementById('scheduleFrequency').value = '1440';
    document.getElementById('schedCookies').checked = true;
    document.getElementById('schedCache').checked = false;
    document.getElementById('schedHistory').checked = false;
    document.getElementById('scheduleDomain').value = '';
}

// ========================================
// Backup & Restore
// ========================================

async function createBackup() {
    const name = document.getElementById('backupName').value.trim() || `Backup ${new Date().toLocaleDateString()}`;
    const password = document.getElementById('backupPassword').value;
    const currentOnly = document.getElementById('backupCurrentOnly').checked;

    try {
        let cookies;
        if (currentOnly && currentTab) {
            cookies = currentCookies;
        } else {
            cookies = await cookieManager.getAllCookies();
        }

        let backupData = {
            name,
            createdAt: Date.now(),
            version: '1.0',
            cookieCount: cookies.length,
            cookies
        };

        // Encrypt if password provided
        if (password) {
            const { encryptData } = await import('../utils/encryption.js');
            backupData = await encryptData(backupData, password);
            backupData.encrypted = true;
        }

        // Download file
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookiecraft-backup-${Date.now()}.cmb`;
        a.click();
        URL.revokeObjectURL(url);

        // Save to local storage for quick restore
        const savedBackups = await storageManager.get('savedBackups') || [];
        savedBackups.unshift({
            id: Date.now().toString(),
            name,
            createdAt: Date.now(),
            cookieCount: cookies.length,
            encrypted: !!password
        });

        // Keep only last 10 backups
        if (savedBackups.length > 10) {
            savedBackups.pop();
        }

        await storageManager.set('savedBackups', savedBackups);

        showToast('Backup created successfully', 'success');
        document.getElementById('backupModalOverlay').classList.remove('show');

    } catch (error) {
        console.error('Error creating backup:', error);
        showToast('Failed to create backup', 'error');
    }
}

async function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    const password = document.getElementById('restorePassword').value;

    if (!fileInput.files.length) {
        showToast('Please select a backup file', 'warning');
        return;
    }

    try {
        const file = fileInput.files[0];
        const content = await file.text();
        let backupData = JSON.parse(content);

        // Decrypt if encrypted
        if (backupData.encrypted) {
            if (!password) {
                showToast('Password required for encrypted backup', 'warning');
                return;
            }
            const { decryptData } = await import('../utils/encryption.js');
            backupData = await decryptData(backupData, password);
        }

        // Restore cookies
        let restored = 0;
        for (const cookie of backupData.cookies) {
            try {
                await cookieManager.setCookie(cookie);
                restored++;
            } catch (e) {
                console.warn('Failed to restore cookie:', cookie.name, e);
            }
        }

        showToast(`Restored ${restored} cookies`, 'success');
        document.getElementById('backupModalOverlay').classList.remove('show');
        await loadCookies();

    } catch (error) {
        console.error('Error restoring backup:', error);
        showToast('Failed to restore backup. Check password if encrypted.', 'error');
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Open dashboard
    document.getElementById('openDashboard').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Quick actions
    document.getElementById('clearSiteCookies').addEventListener('click', async () => {
        if (confirm('Clear all cookies for this site?')) {
            for (const cookie of currentCookies) {
                await cookieManager.deleteCookie(cookie);
            }
            showToast('Site cookies cleared', 'success');
            await loadCookies();
            calculatePrivacyScore();
        }
    });

    document.getElementById('clearAllCookies').addEventListener('click', async () => {
        if (confirm('Clear ALL cookies? This will log you out of all sites.')) {
            await cookieManager.clearAllCookies();
            showToast('All cookies cleared', 'success');
            await loadCookies();
            calculatePrivacyScore();
        }
    });

    document.getElementById('backupCookies').addEventListener('click', () => {
        document.getElementById('backupModalOverlay').classList.add('show');
        loadSavedBackups();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Search
    document.getElementById('cookieSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = currentCookies.filter(cookie =>
            cookie.name.toLowerCase().includes(query) ||
            cookie.domain.toLowerCase().includes(query) ||
            cookie.value.toLowerCase().includes(query)
        );
        renderCookies(filtered);
    });

    // Filter toggle
    document.getElementById('filterToggle').addEventListener('click', () => {
        const panel = document.getElementById('filterPanel');
        const btn = document.getElementById('filterToggle');
        panel.classList.toggle('show');
        btn.classList.toggle('active');
    });

    // Filter changes
    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);

    // Cache clear
    document.getElementById('clearSelectedCache').addEventListener('click', clearSelectedCache);

    // Scheduler
    document.getElementById('addSchedule').addEventListener('click', () => {
        document.getElementById('schedulerForm').classList.remove('hidden');
    });

    document.getElementById('cancelSchedule').addEventListener('click', () => {
        document.getElementById('schedulerForm').classList.add('hidden');
        resetScheduleForm();
    });

    document.getElementById('saveSchedule').addEventListener('click', saveSchedule);

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('show');
    });

    document.getElementById('backupModalClose').addEventListener('click', () => {
        document.getElementById('backupModalOverlay').classList.remove('show');
    });

    // Close modals on overlay click
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            e.target.classList.remove('show');
        }
    });

    document.getElementById('backupModalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'backupModalOverlay') {
            e.target.classList.remove('show');
        }
    });

    // Vault tabs
    document.querySelectorAll('.vault-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.vault-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.vault;
            document.getElementById('vaultBackup').classList.toggle('hidden', target !== 'backup');
            document.getElementById('vaultRestore').classList.toggle('hidden', target !== 'restore');
        });
    });

    // Backup actions
    document.getElementById('createBackup').addEventListener('click', createBackup);
    document.getElementById('restoreBackup').addEventListener('click', restoreBackup);
}

// ========================================
// Filter & Sort
// ========================================

function applyFilters() {
    const filterType = document.getElementById('filterType').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = [...currentCookies];

    // Apply filter
    switch (filterType) {
        case 'session':
            filtered = filtered.filter(c => c.session);
            break;
        case 'persistent':
            filtered = filtered.filter(c => !c.session);
            break;
        case 'secure':
            filtered = filtered.filter(c => c.secure);
            break;
        case 'httpOnly':
            filtered = filtered.filter(c => c.httpOnly);
            break;
    }

    // Apply sort
    switch (sortBy) {
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'domain':
            filtered.sort((a, b) => a.domain.localeCompare(b.domain));
            break;
        case 'expiry':
            filtered.sort((a, b) => (a.expirationDate || 0) - (b.expirationDate || 0));
            break;
        case 'size':
            filtered.sort((a, b) => (b.value.length) - (a.value.length));
            break;
    }

    renderCookies(filtered);
}

// ========================================
// Theme Management
// ========================================

function loadTheme() {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) {
        document.getElementById('appContainer').classList.add('dark-theme');
    }
}

function toggleTheme() {
    const container = document.getElementById('appContainer');
    container.classList.toggle('dark-theme');
    const isDark = container.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
}

// ========================================
// Tab Switching
// ========================================

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabId}Tab`);
    });
}

// ========================================
// Load Saved Backups
// ========================================

async function loadSavedBackups() {
    const savedBackups = await storageManager.get('savedBackups') || [];
    const container = document.getElementById('savedBackups');

    if (savedBackups.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 12px;">No saved backups</p>';
        return;
    }

    container.innerHTML = `
    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Recent Backups:</p>
    ${savedBackups.map(backup => `
      <div class="backup-item" data-id="${backup.id}">
        <div class="backup-info">
          <div class="backup-name">${escapeHtml(backup.name)} ${backup.encrypted ? '🔒' : ''}</div>
          <div class="backup-meta">${backup.cookieCount} cookies • ${new Date(backup.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ========================================
// Utility Functions
// ========================================

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}