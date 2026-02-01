// ========================================
// CookieMaster Pro - Dashboard Script
// ========================================

import { CookieManager } from '../utils/cookieManager.js';
import { CacheManager } from '../utils/cacheManager.js';
import { StorageManager } from '../utils/storageManager.js';
import { getAnalytics } from '../utils/analytics.js';
import { showToast } from '../components/toast.js';
import { drawDonutChart, drawLineChart, drawBarChart } from '../components/charts.js';
import { confirmDialog } from '../components/modal.js';

// Initialize managers
const cookieManager = new CookieManager();
const cacheManager = new CacheManager();
const storageManager = new StorageManager();

// State
let allCookies = [];
let currentPage = 1;
const itemsPerPage = 20;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
    setupEventListeners();
    setupNavigation();
    loadTheme();

    // Check for welcome parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
        showWelcomeMessage();
    }
});

async function initializeDashboard() {
    try {
        // Load all cookies
        allCookies = await cookieManager.getAllCookies();

        // Load analytics
        const analytics = await getAnalytics();

        // Update overview page
        updateOverviewStats(analytics);
        renderActivityChart(analytics.timeline);
        renderCategoryChart(analytics.tracking.categories);
        renderTopDomains(analytics.domains.topDomains);

        // Load other pages
        await loadCookiesPage();
        await loadDomainsPage();
        await loadAnalyticsPage(analytics);
        await loadSchedulesPage();
        await loadVaultPage();
        await loadSettings();

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

// ========================================
// Overview Page
// ========================================

function updateOverviewStats(analytics) {
    document.getElementById('totalCookies').textContent = analytics.overview.totalCookies;
    document.getElementById('totalDomains').textContent = analytics.overview.totalDomains;
    document.getElementById('secureCookies').textContent = analytics.security.securePercent + '%';
    document.getElementById('trackingCookies').textContent = analytics.tracking.trackingCount;
}

function renderActivityChart(timeline) {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const data = timeline.map(day => ({
        label: day.date,
        value: day.count
    }));

    drawLineChart(ctx, data, {
        width: canvas.width,
        height: canvas.height,
        padding: 40,
        lineColor: '#FF9800',
        fillColor: 'rgba(255, 152, 0, 0.1)',
        dotColor: '#FF9800'
    });
}

function renderCategoryChart(categories) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const data = [
        { label: 'Analytics', value: categories.analytics || 1, color: '#2196F3' },
        { label: 'Advertising', value: categories.advertising || 1, color: '#F44336' },
        { label: 'Social', value: categories.social || 1, color: '#9C27B0' },
        { label: 'Session', value: categories.session || 1, color: '#4CAF50' },
        { label: 'Functional', value: categories.functional || 1, color: '#FF9800' },
        { label: 'Other', value: categories.other || 1, color: '#9E9E9E' }
    ];

    drawDonutChart(ctx, data, canvas.width / 2, canvas.height / 2, 80, 25);

    // Render legend
    const legendContainer = document.getElementById('categoryLegend');
    if (legendContainer) {
        legendContainer.innerHTML = data.map(item => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${item.color}"></div>
        <span>${item.label}: ${item.value}</span>
      </div>
    `).join('');
    }
}

function renderTopDomains(domains) {
    const container = document.getElementById('topDomainsList');
    if (!container) return;

    if (domains.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No domains found</p>';
        return;
    }

    container.innerHTML = domains.slice(0, 5).map(domain => `
    <div class="domain-item">
      <div class="domain-icon">
        <img src="https://www.google.com/s2/favicons?domain=${domain.domain}&sz=32" alt="" onerror="this.style.display='none'">
      </div>
      <div class="domain-info">
        <div class="domain-name">${escapeHtml(domain.domain)}</div>
        <div class="domain-stats">${domain.formattedSize}</div>
      </div>
      <div class="domain-count">${domain.count}</div>
    </div>
  `).join('');
}

// ========================================
// Cookies Page
// ========================================

async function loadCookiesPage() {
    renderCookiesTable();
    populateDomainFilter();
}

function renderCookiesTable() {
    const tbody = document.getElementById('allCookiesTable');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = allCookies.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          No cookies found
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = pageItems.map((cookie, index) => {
        const expiryDate = cookie.expirationDate
            ? new Date(cookie.expirationDate * 1000).toLocaleDateString()
            : 'Session';

        return `
      <tr data-index="${startIndex + index}">
        <td><input type="checkbox" class="cookie-checkbox" data-index="${startIndex + index}"></td>
        <td><strong>${escapeHtml(cookie.name)}</strong></td>
        <td>${escapeHtml(cookie.domain)}</td>
        <td><span class="cookie-value" title="${escapeHtml(cookie.value)}">${escapeHtml(cookie.value.substring(0, 30))}${cookie.value.length > 30 ? '...' : ''}</span></td>
        <td>${expiryDate}</td>
        <td>
          ${cookie.secure ? '<span class="badge" style="background: var(--success-light); color: var(--success);">Secure</span>' : ''}
          ${cookie.httpOnly ? '<span class="badge" style="background: var(--info-light); color: var(--info);">HttpOnly</span>' : ''}
        </td>
        <td>
          <button class="btn-icon" onclick="viewCookie(${startIndex + index})" title="View">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          </button>
          <button class="btn-icon danger" onclick="deleteCookieByIndex(${startIndex + index})" title="Delete">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </td>
      </tr>
    `;
    }).join('');

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('cookiesPagination');
    if (!container) return;

    const totalPages = Math.ceil(allCookies.length / itemsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = `
    <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
    </button>
  `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
      `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span style="padding: 0 8px;">...</span>';
        }
    }

    paginationHTML += `
    <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </button>
  `;

    container.innerHTML = paginationHTML;
}

// Make functions globally available
window.changePage = function (page) {
    const totalPages = Math.ceil(allCookies.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCookiesTable();
};

window.viewCookie = function (index) {
    const cookie = allCookies[index];
    if (!cookie) return;

    const expiryDate = cookie.expirationDate
        ? new Date(cookie.expirationDate * 1000).toLocaleString()
        : 'Session';

    const modalContent = `
    <div style="padding: 20px;">
      <div class="detail-row" style="margin-bottom: 16px;">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Name</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px;">${escapeHtml(cookie.name)}</div>
      </div>
      <div class="detail-row" style="margin-bottom: 16px;">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Value</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">${escapeHtml(cookie.value)}</div>
      </div>
      <div class="detail-row" style="margin-bottom: 16px;">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Domain</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px;">${escapeHtml(cookie.domain)}</div>
      </div>
      <div class="detail-row" style="margin-bottom: 16px;">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Path</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px;">${escapeHtml(cookie.path)}</div>
      </div>
      <div class="detail-row" style="margin-bottom: 16px;">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Expires</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px;">${expiryDate}</div>
      </div>
      <div class="detail-row">
        <label style="font-weight: 600; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Attributes</label>
        <div style="background: var(--surface-2-color); padding: 12px; border-radius: 8px; margin-top: 4px;">
          ${cookie.secure ? '🔒 Secure ' : ''}
          ${cookie.httpOnly ? '🛡️ HttpOnly ' : ''}
          ${cookie.sameSite ? '📋 SameSite: ' + cookie.sameSite : ''}
          ${!cookie.secure && !cookie.httpOnly && !cookie.sameSite ? 'None' : ''}
        </div>
      </div>
    </div>
  `;

    // Simple modal implementation
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Cookie Details</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
        ${modalContent}
      </div>
      <div class="modal-footer">
        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        <button class="btn danger" onclick="deleteCookieByIndex(${index}); this.closest('.modal-overlay').remove();">Delete</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
};

window.deleteCookieByIndex = async function (index) {
    const cookie = allCookies[index];
    if (!cookie) return;

    try {
        await cookieManager.deleteCookie(cookie);
        allCookies.splice(index, 1);
        renderCookiesTable();
        showToast('Cookie deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting cookie:', error);
        showToast('Failed to delete cookie', 'error');
    }
};

function populateDomainFilter() {
    const select = document.getElementById('filterDomain');
    if (!select) return;

    const domains = [...new Set(allCookies.map(c => c.domain))].sort();

    select.innerHTML = '<option value="">All Domains</option>' +
        domains.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
}

// ========================================
// Domains Page
// ========================================

async function loadDomainsPage() {
    const container = document.getElementById('domainsGrid');
    if (!container) return;

    const stats = await cookieManager.getStatistics();
    const domainEntries = Object.entries(stats.byDomain).sort((a, b) => b[1] - a[1]);

    if (domainEntries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No domains found</p>';
        return;
    }

    container.innerHTML = domainEntries.map(([domain, count]) => {
        const domainCookies = allCookies.filter(c => c.domain === domain || c.domain === '.' + domain);
        const secureCount = domainCookies.filter(c => c.secure).length;
        const sessionCount = domainCookies.filter(c => c.session).length;

        return `
      <div class="domain-card">
        <div class="domain-card-header">
          <div class="domain-card-icon">
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" onerror="this.parentElement.innerHTML='<svg viewBox=\\'0 0 24 24\\'><path fill=\\'var(--primary-500)\\' d=\\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z\\'/></svg>'">
          </div>
          <div class="domain-card-title">
            <h4>${escapeHtml(domain.replace(/^\./, ''))}</h4>
            <span>${count} cookies</span>
          </div>
        </div>
        <div class="domain-card-stats">
          <div class="domain-stat">
            <span class="domain-stat-value">${count}</span>
            <span class="domain-stat-label">Total</span>
          </div>
          <div class="domain-stat">
            <span class="domain-stat-value">${secureCount}</span>
            <span class="domain-stat-label">Secure</span>
          </div>
          <div class="domain-stat">
            <span class="domain-stat-value">${sessionCount}</span>
            <span class="domain-stat-label">Session</span>
          </div>
        </div>
        <div class="domain-card-actions">
          <button onclick="viewDomainCookies('${escapeHtml(domain)}')">View All</button>
          <button class="danger" onclick="clearDomainCookies('${escapeHtml(domain)}')">Clear All</button>
        </div>
      </div>
    `;
    }).join('');
}

window.viewDomainCookies = function (domain) {
    // Switch to cookies page and filter
    navigateToPage('cookies');
    document.getElementById('filterDomain').value = domain;
    filterCookies();
};

window.clearDomainCookies = async function (domain) {
    const confirmed = await confirmDialog(`Clear all cookies for ${domain}?`, {
        title: 'Confirm Delete',
        confirmText: 'Clear Cookies',
        cancelText: 'Cancel'
    });

    if (confirmed) {
        try {
            await cookieManager.deleteCookiesForDomain(domain);
            allCookies = await cookieManager.getAllCookies();
            await loadDomainsPage();
            renderCookiesTable();
            showToast(`Cookies cleared for ${domain}`, 'success');
        } catch (error) {
            console.error('Error clearing domain cookies:', error);
            showToast('Failed to clear cookies', 'error');
        }
    }
};

// ========================================
// Analytics Page
// ========================================

async function loadAnalyticsPage(analytics) {
    renderTimelineChart(analytics.timeline);
    renderSecurityMetrics(analytics.security);
    renderTrackingBreakdown(analytics.tracking);
    renderExpiryChart(analytics.expiry);
}

function renderTimelineChart(timeline) {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const data = timeline.map(day => ({
        label: day.date,
        value: day.count
    }));

    drawBarChart(ctx, data, {
        width: canvas.width,
        height: canvas.height,
        barColor: '#FF9800'
    });
}

function renderSecurityMetrics(security) {
    const container = document.getElementById('securityMetrics');
    if (!container) return;

    container.innerHTML = `
    <div class="security-metric">
      <span class="security-metric-label">Secure Cookies</span>
      <div class="security-metric-bar">
        <div class="security-metric-fill green" style="width: ${security.securePercent}%"></div>
      </div>
      <span class="security-metric-value">${security.securePercent}%</span>
    </div>
    <div class="security-metric">
      <span class="security-metric-label">HttpOnly</span>
      <div class="security-metric-bar">
        <div class="security-metric-fill orange" style="width: ${security.httpOnlyPercent}%"></div>
      </div>
      <span class="security-metric-value">${security.httpOnlyPercent}%</span>
    </div>
    <div class="security-metric">
      <span class="security-metric-label">SameSite Strict</span>
      <div class="security-metric-bar">
        <div class="security-metric-fill green" style="width: ${Math.round((security.sameSite.strict / (security.sameSite.strict + security.sameSite.lax + security.sameSite.none || 1)) * 100)}%"></div>
      </div>
      <span class="security-metric-value">${security.sameSite.strict}</span>
    </div>
    <div class="security-metric">
      <span class="security-metric-label">Security Score</span>
      <div class="security-metric-bar">
        <div class="security-metric-fill ${security.securityScore >= 70 ? 'green' : security.securityScore >= 40 ? 'orange' : 'red'}" style="width: ${security.securityScore}%"></div>
      </div>
      <span class="security-metric-value">${security.securityScore}%</span>
    </div>
  `;
}

function renderTrackingBreakdown(tracking) {
    const container = document.getElementById('trackingBreakdown');
    if (!container) return;

    container.innerHTML = `
    <div class="tracking-item">
      <div class="tracking-item-icon analytics">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
      </div>
      <div class="tracking-item-info">
        <div class="tracking-item-name">Analytics</div>
        <div class="tracking-item-desc">Google Analytics, Mixpanel, etc.</div>
      </div>
      <div class="tracking-item-count">${tracking.categories.analytics}</div>
    </div>
    <div class="tracking-item">
      <div class="tracking-item-icon advertising">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </div>
      <div class="tracking-item-info">
        <div class="tracking-item-name">Advertising</div>
        <div class="tracking-item-desc">DoubleClick, AdSense, Criteo, etc.</div>
      </div>
      <div class="tracking-item-count">${tracking.categories.advertising}</div>
    </div>
    <div class="tracking-item">
      <div class="tracking-item-icon social">
        <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
      </div>
      <div class="tracking-item-info">
        <div class="tracking-item-name">Social Media</div>
        <div class="tracking-item-desc">Facebook, Twitter, LinkedIn, etc.</div>
      </div>
      <div class="tracking-item-count">${tracking.categories.social}</div>
    </div>
  `;
}

function renderExpiryChart(expiry) {
    const canvas = document.getElementById('expiryChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const data = [
        { label: 'Session', value: expiry.session || 1, color: '#FF9800' },
        { label: '<24h', value: expiry.within24Hours || 1, color: '#4CAF50' },
        { label: '<7d', value: expiry.within7Days || 1, color: '#2196F3' },
        { label: '<30d', value: expiry.within30Days || 1, color: '#9C27B0' },
        { label: '<1y', value: expiry.within1Year || 1, color: '#FF5722' },
        { label: '>1y', value: expiry.over1Year || 1, color: '#F44336' }
    ];

    drawDonutChart(ctx, data, canvas.width / 2, canvas.height / 2, 70, 20);
}

// ========================================
// Schedules Page
// ========================================

async function loadSchedulesPage() {
    const container = document.getElementById('schedulesGrid');
    if (!container) return;

    const schedules = await storageManager.get('schedules') || [];

    if (schedules.length === 0) {
        container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <svg viewBox="0 0 24 24" width="64" height="64" style="fill: var(--text-secondary); margin-bottom: 16px;">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        <h3 style="margin-bottom: 8px;">No Schedules Yet</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Create automated cleanup schedules to keep your browser clean</p>
        <button class="btn primary" onclick="showAddScheduleModal()">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Create Schedule
        </button>
      </div>
    `;
        return;
    }

    const frequencyLabels = {
        30: 'Every 30 minutes',
        60: 'Every hour',
        360: 'Every 6 hours',
        720: 'Every 12 hours',
        1440: 'Daily',
        10080: 'Weekly'
    };

    container.innerHTML = schedules.map((schedule, index) => `
    <div class="schedule-card">
      <div class="schedule-card-header">
        <div class="schedule-card-icon">
          <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
        </div>
        <div class="schedule-card-title">
          <h4>${escapeHtml(schedule.name)}</h4>
          <span>${frequencyLabels[schedule.frequency] || schedule.frequency + ' min'}</span>
        </div>
      </div>
      <div class="schedule-card-body">
        <div class="schedule-detail">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
          <span class="schedule-detail-label">Targets:</span>
          <span class="schedule-detail-value">
            ${schedule.targets.cookies ? 'Cookies' : ''}
            ${schedule.targets.cache ? ', Cache' : ''}
            ${schedule.targets.history ? ', History' : ''}
          </span>
        </div>
        ${schedule.domain ? `
          <div class="schedule-detail">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
            <span class="schedule-detail-label">Domain:</span>
            <span class="schedule-detail-value">${escapeHtml(schedule.domain)}</span>
          </div>
        ` : ''}
        <div class="schedule-detail">
          <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2z"/></svg>
          <span class="schedule-detail-label">Created:</span>
          <span class="schedule-detail-value">${new Date(schedule.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="schedule-card-footer">
        <div class="schedule-status ${schedule.enabled ? 'active' : 'paused'}">
          <span class="schedule-status-dot"></span>
          ${schedule.enabled ? 'Active' : 'Paused'}
        </div>
        <div>
          <button class="btn-icon" onclick="toggleScheduleStatus(${index})" title="${schedule.enabled ? 'Pause' : 'Enable'}">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="${schedule.enabled ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' : 'M8 5v14l11-7z'}"/></svg>
          </button>
          <button class="btn-icon danger" onclick="deleteSchedule(${index})" title="Delete">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

window.showAddScheduleModal = function () {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Create New Schedule</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Schedule Name</label>
          <input type="text" id="newScheduleName" placeholder="e.g., Daily Cleanup">
        </div>
        <div class="form-group">
          <label>Frequency</label>
          <select id="newScheduleFrequency">
            <option value="30">Every 30 minutes</option>
            <option value="60">Every hour</option>
            <option value="360">Every 6 hours</option>
            <option value="720">Every 12 hours</option>
            <option value="1440" selected>Daily</option>
            <option value="10080">Weekly</option>
          </select>
        </div>
        <div class="form-group">
          <label>What to clean:</label>
          <div style="display: flex; gap: 20px; margin-top: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="newSchedCookies" checked> Cookies
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="newSchedCache"> Cache
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="newSchedHistory"> History
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Domain Filter (optional)</label>
          <input type="text" id="newScheduleDomain" placeholder="e.g., *.example.com">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn primary" onclick="createNewSchedule()">Create Schedule</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
};

window.createNewSchedule = async function () {
    const name = document.getElementById('newScheduleName').value.trim();
    const frequency = parseInt(document.getElementById('newScheduleFrequency').value);
    const targets = {
        cookies: document.getElementById('newSchedCookies').checked,
        cache: document.getElementById('newSchedCache').checked,
        history: document.getElementById('newSchedHistory').checked
    };
    const domain = document.getElementById('newScheduleDomain').value.trim();

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

    const schedules = await storageManager.get('schedules') || [];
    schedules.push(schedule);
    await storageManager.set('schedules', schedules);

    // Create alarm via background script
    await chrome.runtime.sendMessage({
        action: 'createSchedule',
        schedule
    });

    document.querySelector('.modal-overlay').remove();
    await loadSchedulesPage();
    showToast('Schedule created successfully', 'success');
};

window.toggleScheduleStatus = async function (index) {
    const schedules = await storageManager.get('schedules') || [];
    schedules[index].enabled = !schedules[index].enabled;
    await storageManager.set('schedules', schedules);

    await chrome.runtime.sendMessage({
        action: schedules[index].enabled ? 'enableSchedule' : 'disableSchedule',
        scheduleId: schedules[index].id
    });

    await loadSchedulesPage();
    showToast(`Schedule ${schedules[index].enabled ? 'enabled' : 'paused'}`, 'success');
};

window.deleteSchedule = async function (index) {
    const confirmed = await confirmDialog('Are you sure you want to delete this schedule?', {
        title: 'Delete Schedule',
        confirmText: 'Delete',
        cancelText: 'Cancel'
    });

    if (confirmed) {
        const schedules = await storageManager.get('schedules') || [];
        const scheduleId = schedules[index].id;
        schedules.splice(index, 1);
        await storageManager.set('schedules', schedules);

        await chrome.runtime.sendMessage({
            action: 'deleteSchedule',
            scheduleId
        });

        await loadSchedulesPage();
        showToast('Schedule deleted', 'success');
    }
};

// ========================================
// Vault Page
// ========================================

async function loadVaultPage() {
    await loadSavedBackups();
    setupFileDropZone();
}

async function loadSavedBackups() {
    const container = document.getElementById('vaultBackupsList');
    if (!container) return;

    const backups = await storageManager.get('savedBackups') || [];

    if (backups.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No backups saved yet</p>';
        return;
    }

    container.innerHTML = backups.map((backup, index) => `
    <div class="backup-item">
      <div class="backup-item-icon">
        <svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
      </div>
      <div class="backup-item-info">
        <div class="backup-item-name">${escapeHtml(backup.name)} ${backup.encrypted ? '🔒' : ''}</div>
        <div class="backup-item-meta">${backup.cookieCount} cookies • ${new Date(backup.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="backup-item-actions">
        <button onclick="deleteBackup(${index})" title="Delete">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function setupFileDropZone() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('restoreFileInput');
    const restoreBtn = document.getElementById('restoreVaultBackup');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-500)';
        dropZone.style.background = 'var(--primary-50)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const dropZone = document.getElementById('fileDropZone');
    const restoreBtn = document.getElementById('restoreVaultBackup');

    dropZone.querySelector('p').textContent = `Selected: ${file.name}`;
    restoreBtn.disabled = false;
}

// ========================================
// Settings Page
// ========================================

async function loadSettings() {
    const settings = await storageManager.get('settings') || {};

    document.getElementById('settingShowBadge').checked = settings.showBadge !== false;
    document.getElementById('settingNotifications').checked = settings.notifications !== false;
    document.getElementById('settingTrackingProtection').checked = settings.trackingProtection !== false;
    document.getElementById('settingAutoClean').checked = settings.autoCleanOnClose === true;
    document.getElementById('settingTheme').value = settings.theme || 'light';
}

async function saveSettings() {
    const settings = {
        showBadge: document.getElementById('settingShowBadge').checked,
        notifications: document.getElementById('settingNotifications').checked,
        trackingProtection: document.getElementById('settingTrackingProtection').checked,
        autoCleanOnClose: document.getElementById('settingAutoClean').checked,
        theme: document.getElementById('settingTheme').value
    };

    await storageManager.set('settings', settings);

    // Apply theme
    if (settings.theme === 'dark') {
        document.getElementById('dashboardContainer').classList.add('dark-theme');
    } else if (settings.theme === 'light') {
        document.getElementById('dashboardContainer').classList.remove('dark-theme');
    }

    // Update badge
    await chrome.runtime.sendMessage({ action: 'updateBadge' });

    showToast('Settings saved', 'success');
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Quick Actions
    document.getElementById('clearAllCookiesBtn')?.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Clear ALL cookies? This will log you out of all sites.', {
            title: 'Clear All Cookies',
            confirmText: 'Clear All',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            await cookieManager.clearAllCookies();
            allCookies = [];
            await initializeDashboard();
            showToast('All cookies cleared', 'success');
        }
    });

    document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Clear browser cache?', {
            title: 'Clear Cache',
            confirmText: 'Clear',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            await cacheManager.clearCache();
            showToast('Cache cleared', 'success');
        }
    });

    document.getElementById('exportAllBtn')?.addEventListener('click', async () => {
        const data = await cookieManager.exportCookies();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookiemaster-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Cookies exported', 'success');
    });

    document.getElementById('createScheduleBtn')?.addEventListener('click', () => {
        navigateToPage('schedules');
        setTimeout(() => showAddScheduleModal(), 300);
    });

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Delete selected cookies
    document.getElementById('deleteSelectedBtn')?.addEventListener('click', deleteSelectedCookies);

    // Select all cookies
    document.getElementById('selectAllCookies')?.addEventListener('change', (e) => {
        document.querySelectorAll('.cookie-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Cookie search
    document.getElementById('allCookiesSearch')?.addEventListener('input', filterCookies);

    // Cookie filters
    document.getElementById('filterDomain')?.addEventListener('change', filterCookies);
    document.getElementById('filterCookieType')?.addEventListener('change', filterCookies);
    document.getElementById('sortCookies')?.addEventListener('change', filterCookies);

    // Vault - Create backup
    document.getElementById('createVaultBackup')?.addEventListener('click', createVaultBackup);

    // Vault - Restore backup
    document.getElementById('restoreVaultBackup')?.addEventListener('click', restoreVaultBackup);

    // Settings - Save on change
    document.querySelectorAll('#settingsPage input, #settingsPage select').forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    // Settings - Export
    document.getElementById('exportSettings')?.addEventListener('click', exportAllSettings);

    // Settings - Import
    document.getElementById('importSettings')?.addEventListener('click', importSettings);

    // Settings - Reset
    document.getElementById('resetAllData')?.addEventListener('click', resetAllData);

    // Add schedule button
    document.getElementById('addScheduleBtn')?.addEventListener('click', showAddScheduleModal);
}

// ========================================
// Navigation
// ========================================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });

    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(pageId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `${pageId}Page`);
    });
}

// ========================================
// Cookie Filtering
// ========================================

async function filterCookies() {
    const searchQuery = document.getElementById('allCookiesSearch')?.value.toLowerCase() || '';
    const domainFilter = document.getElementById('filterDomain')?.value || '';
    const typeFilter = document.getElementById('filterCookieType')?.value || '';
    const sortBy = document.getElementById('sortCookies')?.value || 'name';

    // Get fresh cookies
    let filtered = await cookieManager.getAllCookies();

    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchQuery) ||
            c.domain.toLowerCase().includes(searchQuery) ||
            c.value.toLowerCase().includes(searchQuery)
        );
    }

    // Apply domain filter
    if (domainFilter) {
        filtered = filtered.filter(c => c.domain === domainFilter || c.domain === '.' + domainFilter);
    }

    // Apply type filter
    switch (typeFilter) {
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

    allCookies = filtered;
    currentPage = 1;
    renderCookiesTable();
}

async function deleteSelectedCookies() {
    const selected = document.querySelectorAll('.cookie-checkbox:checked');
    if (selected.length === 0) {
        showToast('No cookies selected', 'warning');
        return;
    }

    const confirmed = await confirmDialog(`Delete ${selected.length} selected cookies?`, {
        title: 'Delete Cookies',
        confirmText: 'Delete',
        cancelText: 'Cancel'
    });

    if (confirmed) {
        const indices = Array.from(selected).map(cb => parseInt(cb.dataset.index));
        const toDelete = indices.map(i => allCookies[i]).filter(Boolean);

        for (const cookie of toDelete) {
            await cookieManager.deleteCookie(cookie);
        }

        allCookies = await cookieManager.getAllCookies();
        renderCookiesTable();
        showToast(`${toDelete.length} cookies deleted`, 'success');
    }
}

// ========================================
// Vault Functions
// ========================================

async function createVaultBackup() {
    const name = document.getElementById('vaultBackupName')?.value.trim() || `Backup ${new Date().toLocaleDateString()}`;
    const password = document.getElementById('vaultBackupPassword')?.value;
    const includeAll = document.getElementById('vaultIncludeAll')?.checked !== false;

    try {
        const cookies = await cookieManager.getAllCookies();

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
        a.download = `cookiemaster-backup-${Date.now()}.cmb`;
        a.click();
        URL.revokeObjectURL(url);

        // Save to local storage
        const savedBackups = await storageManager.get('savedBackups') || [];
        savedBackups.unshift({
            id: Date.now().toString(),
            name,
            createdAt: Date.now(),
            cookieCount: cookies.length,
            encrypted: !!password
        });

        if (savedBackups.length > 10) savedBackups.pop();
        await storageManager.set('savedBackups', savedBackups);

        await loadSavedBackups();
        showToast('Backup created successfully', 'success');

        // Reset form
        document.getElementById('vaultBackupName').value = '';
        document.getElementById('vaultBackupPassword').value = '';

    } catch (error) {
        console.error('Backup error:', error);
        showToast('Failed to create backup', 'error');
    }
}

async function restoreVaultBackup() {
    const fileInput = document.getElementById('restoreFileInput');
    const password = document.getElementById('vaultRestorePassword')?.value;

    if (!fileInput?.files.length) {
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
                console.warn('Failed to restore cookie:', cookie.name);
            }
        }

        allCookies = await cookieManager.getAllCookies();
        await initializeDashboard();

        showToast(`Restored ${restored} cookies`, 'success');

        // Reset form
        fileInput.value = '';
        document.getElementById('vaultRestorePassword').value = '';
        document.getElementById('fileDropZone').querySelector('p').textContent = 'Drop backup file here or click to browse';
        document.getElementById('restoreVaultBackup').disabled = true;

    } catch (error) {
        console.error('Restore error:', error);
        showToast('Failed to restore backup. Check password if encrypted.', 'error');
    }
}

window.deleteBackup = async function (index) {
    const backups = await storageManager.get('savedBackups') || [];
    backups.splice(index, 1);
    await storageManager.set('savedBackups', backups);
    await loadSavedBackups();
    showToast('Backup deleted', 'success');
};

// ========================================
// Settings Functions
// ========================================

async function exportAllSettings() {
    const settings = await storageManager.get('settings');
    const schedules = await storageManager.get('schedules');

    const data = {
        exportedAt: Date.now(),
        settings,
        schedules
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookiemaster-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Settings exported', 'success');
}

async function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const data = JSON.parse(content);

            if (data.settings) {
                await storageManager.set('settings', data.settings);
            }

            if (data.schedules) {
                await storageManager.set('schedules', data.schedules);

                // Recreate schedule alarms
                for (const schedule of data.schedules) {
                    if (schedule.enabled) {
                        await chrome.runtime.sendMessage({
                            action: 'createSchedule',
                            schedule
                        });
                    }
                }
            }

            await loadSettings();
            await loadSchedulesPage();
            showToast('Settings imported successfully', 'success');

        } catch (error) {
            console.error('Import error:', error);
            showToast('Failed to import settings', 'error');
        }
    };

    input.click();
}

async function resetAllData() {
    const confirmed = await confirmDialog(
        'This will reset all settings, schedules, and saved backups. This action cannot be undone.',
        {
            title: 'Reset All Data',
            confirmText: 'Reset Everything',
            cancelText: 'Cancel'
        }
    );

    if (confirmed) {
        // Clear all alarms
        const schedules = await storageManager.get('schedules') || [];
        for (const schedule of schedules) {
            await chrome.runtime.sendMessage({
                action: 'deleteSchedule',
                scheduleId: schedule.id
            });
        }

        // Clear storage
        await storageManager.clear();

        // Re-initialize with defaults
        await storageManager.set('settings', {
            theme: 'light',
            notifications: true,
            autoCleanOnClose: false,
            trackingProtection: true,
            showBadge: true
        });

        await storageManager.set('schedules', []);
        await storageManager.set('savedBackups', []);
        await storageManager.set('cookieHistory', []);

        // Reload everything
        await loadSettings();
        await loadSchedulesPage();
        await loadVaultPage();

        showToast('All data has been reset', 'success');
    }
}

// ========================================
// Theme Management
// ========================================

function loadTheme() {
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme === 'dark') {
        document.getElementById('dashboardContainer').classList.add('dark-theme');
    }
}

function toggleTheme() {
    const container = document.getElementById('dashboardContainer');
    container.classList.toggle('dark-theme');
    const isDark = container.classList.contains('dark-theme');
    localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
}

// ========================================
// Welcome Message
// ========================================

function showWelcomeMessage() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
    <div class="modal" style="max-width: 500px; text-align: center;">
      <div class="modal-body" style="padding: 40px;">
        <svg viewBox="0 0 40 40" width="80" height="80" style="margin-bottom: 20px;">
          <circle cx="20" cy="20" r="18" fill="url(#welcomeGradient)"/>
          <circle cx="12" cy="14" r="3" fill="#5D4037"/>
          <circle cx="24" cy="12" r="2.5" fill="#5D4037"/>
          <circle cx="28" cy="22" r="2" fill="#5D4037"/>
          <circle cx="14" cy="26" r="2.5" fill="#5D4037"/>
          <circle cx="22" cy="28" r="2" fill="#5D4037"/>
          <defs>
            <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF9800"/>
              <stop offset="100%" style="stop-color:#F57C00"/>
            </linearGradient>
          </defs>
        </svg>
        <h2 style="margin-bottom: 16px; font-size: 24px;">Welcome to CookieMaster Pro!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
          Thank you for installing CookieMaster Pro. Your all-in-one solution for managing cookies, 
          cache, and browsing data with powerful features like automated schedules, encrypted backups, 
          and detailed analytics.
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left; background: var(--surface-2-color); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-500)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>View and manage all cookies in one place</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-500)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Create automated cleanup schedules</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-500)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Backup and restore cookies securely</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--primary-500)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Track and block tracking cookies</span>
          </div>
        </div>
        <button class="btn primary" style="width: 100%;" onclick="this.closest('.modal-overlay').remove()">
          Get Started
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // Remove welcome param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('welcome');
    window.history.replaceState({}, '', url);
}

// ========================================
// Utility Functions
// ========================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add some global styles for buttons
const style = document.createElement('style');
style.textContent = `
  .btn-icon {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
    color: var(--text-secondary);
  }
  
  .btn-icon:hover {
    background: var(--surface-2-color);
  }
  
  .btn-icon.danger:hover {
    background: var(--error-light);
    color: var(--error);
  }
  
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    margin-right: 4px;
  }
  
  .modal {
    background: var(--surface-color);
    border-radius: 16px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: modalIn 0.3s ease;
  }
  
  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .modal-header h3 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }
  
  .modal-close:hover {
    background: var(--surface-2-color);
  }
  
  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: 60vh;
  }
  
  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    justify-content: flex-end;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .modal-overlay.show {
    display: flex;
  }
`;
document.head.appendChild(style);

console.log('CookieMaster Pro Dashboard loaded');