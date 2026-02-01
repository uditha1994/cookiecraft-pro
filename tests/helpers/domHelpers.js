/**
 * DOM Helper Functions for Testing
 */

/**
 * Create popup HTML structure
 */
export function createPopupDOM() {
    document.body.innerHTML = `
    <div class="app-container" id="appContainer">
      <header class="header">
        <div class="logo-section">
          <div class="logo"></div>
          <div class="brand">
            <h1>CookieMaster</h1>
            <span class="pro-badge">PRO</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="themeToggle"></button>
          <button class="icon-btn" id="openDashboard"></button>
        </div>
      </header>

      <section class="site-info-card">
        <div class="site-favicon" id="siteFavicon"></div>
        <div class="site-details">
          <h2 id="siteDomain">Loading...</h2>
          <div class="site-stats">
            <span class="stat">
              <span id="cookieCount">0</span> cookies
            </span>
            <span class="stat">
              <span id="storageSize">0 KB</span>
            </span>
          </div>
        </div>
        <div class="privacy-score" id="privacyScore">
          <div class="score-ring">
            <svg viewBox="0 0 36 36">
              <path class="score-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="score-fill" id="scoreRing" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <span class="score-value" id="scoreValue">--</span>
          </div>
        </div>
      </section>

      <section class="quick-actions">
        <button class="action-btn primary" id="clearSiteCookies">Clear Site Cookies</button>
        <button class="action-btn secondary" id="clearAllCookies">Clear All</button>
        <button class="action-btn accent" id="backupCookies">Backup</button>
      </section>

      <nav class="tabs-nav">
        <button class="tab-btn active" data-tab="cookies">Cookies</button>
        <button class="tab-btn" data-tab="cache">Cache</button>
        <button class="tab-btn" data-tab="scheduler">Scheduler</button>
      </nav>

      <div class="tab-content">
        <div class="tab-pane active" id="cookiesTab">
          <div class="search-bar">
            <input type="text" id="cookieSearch" placeholder="Search cookies...">
            <button class="filter-btn" id="filterToggle"></button>
          </div>
          <div class="filter-panel" id="filterPanel">
            <div class="filter-group">
              <select id="filterType">
                <option value="all">All</option>
                <option value="session">Session</option>
                <option value="persistent">Persistent</option>
                <option value="secure">Secure</option>
                <option value="httpOnly">HttpOnly</option>
              </select>
            </div>
            <div class="filter-group">
              <select id="sortBy">
                <option value="name">Name</option>
                <option value="domain">Domain</option>
                <option value="expiry">Expiry</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>
          <div class="cookies-list" id="cookiesList"></div>
        </div>

        <div class="tab-pane" id="cacheTab">
          <div class="cache-overview">
            <div class="cache-chart">
              <canvas id="cacheCanvas" width="100" height="100"></canvas>
            </div>
            <div class="cache-legend" id="cacheLegend"></div>
          </div>
          <div class="cache-actions">
            <label class="checkbox-container">
              <input type="checkbox" id="clearBrowsingHistory">
              <span class="checkmark"></span>
              <span class="label-text">Browsing History</span>
            </label>
            <label class="checkbox-container">
              <input type="checkbox" id="clearDownloads">
              <span class="checkmark"></span>
              <span class="label-text">Download History</span>
            </label>
            <label class="checkbox-container">
              <input type="checkbox" id="clearCache" checked>
              <span class="checkmark"></span>
              <span class="label-text">Cached Images & Files</span>
            </label>
            <label class="checkbox-container">
              <input type="checkbox" id="clearFormData">
              <span class="checkmark"></span>
              <span class="label-text">Form Data</span>
            </label>
            <label class="checkbox-container">
              <input type="checkbox" id="clearLocalStorage">
              <span class="checkmark"></span>
              <span class="label-text">Local Storage</span>
            </label>
          </div>
          <div class="time-range">
            <label>Time Range:</label>
            <select id="timeRange">
              <option value="3600000">Last Hour</option>
              <option value="86400000">Last 24 Hours</option>
              <option value="604800000">Last 7 Days</option>
              <option value="2592000000">Last 4 Weeks</option>
              <option value="0" selected>All Time</option>
            </select>
          </div>
          <button class="action-btn primary full-width" id="clearSelectedCache">
            Clear Selected Data
          </button>
        </div>

        <div class="tab-pane" id="schedulerTab">
          <div class="scheduler-header">
            <h3>Auto-Clean Schedules</h3>
            <button class="add-schedule-btn" id="addSchedule">Add Schedule</button>
          </div>
          <div class="schedules-list" id="schedulesList"></div>
          <div class="scheduler-form hidden" id="schedulerForm">
            <div class="form-group">
              <label>Schedule Name</label>
              <input type="text" id="scheduleName" placeholder="e.g., Daily Cleanup">
            </div>
            <div class="form-group">
              <label>Frequency</label>
              <select id="scheduleFrequency">
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
                <option value="360">Every 6 hours</option>
                <option value="720">Every 12 hours</option>
                <option value="1440" selected>Daily</option>
                <option value="10080">Weekly</option>
              </select>
            </div>
            <div class="form-group">
              <div class="target-options">
                <label class="checkbox-container small">
                  <input type="checkbox" id="schedCookies" checked>
                  <span class="checkmark"></span>
                  Cookies
                </label>
                <label class="checkbox-container small">
                  <input type="checkbox" id="schedCache">
                  <span class="checkmark"></span>
                  Cache
                </label>
                <label class="checkbox-container small">
                  <input type="checkbox" id="schedHistory">
                  <span class="checkmark"></span>
                  History
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Domain Filter (optional)</label>
              <input type="text" id="scheduleDomain" placeholder="e.g., *.example.com">
            </div>
            <div class="form-actions">
              <button class="btn secondary" id="cancelSchedule">Cancel</button>
              <button class="btn primary" id="saveSchedule">Save Schedule</button>
            </div>
          </div>
        </div>
      </div>

      <div class="toast-container" id="toastContainer"></div>
    </div>

    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" id="cookieModal">
        <div class="modal-header">
          <h3 id="modalTitle">Cookie Details</h3>
          <button class="modal-close" id="modalClose"></button>
        </div>
        <div class="modal-body" id="modalBody"></div>
        <div class="modal-footer" id="modalFooter"></div>
      </div>
    </div>

    <div class="modal-overlay" id="backupModalOverlay">
      <div class="modal" id="backupModal">
        <div class="modal-header">
          <h3>Cookie Vault</h3>
          <button class="modal-close" id="backupModalClose"></button>
        </div>
        <div class="modal-body">
          <div class="vault-tabs">
            <button class="vault-tab active" data-vault="backup">Backup</button>
            <button class="vault-tab" data-vault="restore">Restore</button>
          </div>
          <div class="vault-content" id="vaultBackup">
            <div class="form-group">
              <label>Backup Name</label>
              <input type="text" id="backupName" placeholder="My Backup">
            </div>
            <div class="form-group">
              <label>Encryption Password (optional)</label>
              <input type="password" id="backupPassword" placeholder="Enter password">
            </div>
            <div class="form-group">
              <label class="checkbox-container small">
                <input type="checkbox" id="backupAllDomains" checked>
                <span class="checkmark"></span>
                All Domains
              </label>
              <label class="checkbox-container small">
                <input type="checkbox" id="backupCurrentOnly">
                <span class="checkmark"></span>
                Current Site Only
              </label>
            </div>
            <button class="btn primary full-width" id="createBackup">Create Backup</button>
          </div>
          <div class="vault-content hidden" id="vaultRestore">
            <div class="form-group">
              <div class="file-upload">
                <input type="file" id="restoreFile" accept=".json,.cmb">
                <label for="restoreFile">Choose file or drag here</label>
              </div>
            </div>
            <div class="form-group">
              <label>Decryption Password (if encrypted)</label>
              <input type="password" id="restorePassword" placeholder="Enter password">
            </div>
            <div class="backup-list" id="savedBackups"></div>
            <button class="btn primary full-width" id="restoreBackup">Restore Cookies</button>
          </div>
        </div>
      </div>
    </div>
  `;

    return document.body;
}

/**
 * Create dashboard HTML structure
 */
export function createDashboardDOM() {
    document.body.innerHTML = `
    <div class="dashboard-container" id="dashboardContainer">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <a href="#" class="nav-item active" data-page="overview">Overview</a>
          <a href="#" class="nav-item" data-page="cookies">All Cookies</a>
          <a href="#" class="nav-item" data-page="domains">Domains</a>
          <a href="#" class="nav-item" data-page="analytics">Analytics</a>
          <a href="#" class="nav-item" data-page="schedules">Schedules</a>
          <a href="#" class="nav-item" data-page="vault">Cookie Vault</a>
          <a href="#" class="nav-item" data-page="settings">Settings</a>
        </nav>
        <div class="sidebar-footer">
          <button class="theme-btn" id="themeToggle"></button>
        </div>
      </aside>

      <main class="main-content">
        <div class="page active" id="overviewPage">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value" id="totalCookies">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="totalDomains">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="secureCookies">0%</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="trackingCookies">0</span>
            </div>
          </div>
          <div class="charts-section">
            <canvas id="activityChart"></canvas>
            <canvas id="categoryChart"></canvas>
          </div>
          <div class="domains-list" id="topDomainsList"></div>
          <div class="actions-grid">
            <button id="clearAllCookiesBtn">Clear All Cookies</button>
            <button id="clearCacheBtn">Clear Cache</button>
            <button id="exportAllBtn">Export All</button>
            <button id="createScheduleBtn">New Schedule</button>
          </div>
        </div>

        <div class="page" id="cookiesPage">
          <div class="search-box">
            <input type="text" id="allCookiesSearch" placeholder="Search cookies...">
          </div>
          <div class="filters-bar">
            <select id="filterDomain"></select>
            <select id="filterCookieType">
              <option value="">All Types</option>
              <option value="session">Session</option>
              <option value="persistent">Persistent</option>
              <option value="secure">Secure</option>
              <option value="httpOnly">HttpOnly</option>
            </select>
            <select id="sortCookies">
              <option value="name">Name</option>
              <option value="domain">Domain</option>
              <option value="expiry">Expiry</option>
              <option value="size">Size</option>
            </select>
          </div>
          <table class="cookies-table">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAllCookies"></th>
                <th>Name</th>
                <th>Domain</th>
                <th>Value</th>
                <th>Expires</th>
                <th>Attributes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="allCookiesTable"></tbody>
          </table>
          <div class="pagination" id="cookiesPagination"></div>
          <button class="btn primary" id="deleteSelectedBtn">Delete Selected</button>
        </div>

        <div class="page" id="domainsPage">
          <div class="domains-grid" id="domainsGrid"></div>
        </div>

        <div class="page" id="analyticsPage">
          <canvas id="timelineChart"></canvas>
          <div id="securityMetrics"></div>
          <canvas id="expiryChart"></canvas>
          <div id="trackingBreakdown"></div>
        </div>

        <div class="page" id="schedulesPage">
          <button class="btn primary" id="addScheduleBtn">Add Schedule</button>
          <div class="schedules-grid" id="schedulesGrid"></div>
        </div>

        <div class="page" id="vaultPage">
          <div class="vault-section">
            <input type="text" id="vaultBackupName">
            <input type="password" id="vaultBackupPassword">
            <input type="checkbox" id="vaultIncludeAll" checked>
            <button id="createVaultBackup">Create Backup</button>
          </div>
          <div class="backups-list" id="vaultBackupsList"></div>
          <div class="file-drop-zone" id="fileDropZone">
            <input type="file" id="restoreFileInput" accept=".json,.cmb" hidden>
          </div>
          <input type="password" id="vaultRestorePassword">
          <button id="restoreVaultBackup" disabled>Restore Backup</button>
        </div>

        <div class="page" id="settingsPage">
          <input type="checkbox" id="settingShowBadge" checked>
          <input type="checkbox" id="settingNotifications" checked>
          <input type="checkbox" id="settingTrackingProtection" checked>
          <input type="checkbox" id="settingAutoClean">
          <select id="settingTheme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">System Default</option>
          </select>
          <button id="exportSettings">Export</button>
          <button id="importSettings">Import</button>
          <button id="resetAllData">Reset</button>
        </div>
      </main>
    </div>
    <div class="toast-container" id="toastContainer"></div>
  `;

    return document.body;
}

/**
 * Clean up DOM after tests
 */
export function cleanupDOM() {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
}

/**
 * Query helper functions
 */
export const query = {
    byId: (id) => document.getElementById(id),
    byClass: (className) => document.getElementsByClassName(className),
    bySelector: (selector) => document.querySelector(selector),
    bySelectorAll: (selector) => document.querySelectorAll(selector)
};

/**
 * Create a cookie item element
 */
export function createCookieItemElement(cookie) {
    const item = document.createElement('div');
    item.className = 'cookie-item';
    item.innerHTML = `
    <div class="cookie-icon-wrapper ${cookie.secure ? 'secure' : ''}"></div>
    <div class="cookie-info">
      <div class="cookie-name">${cookie.name}</div>
      <div class="cookie-domain">${cookie.domain}</div>
    </div>
    <div class="cookie-badges">
      ${cookie.secure ? '<span class="badge secure">Secure</span>' : ''}
      ${cookie.httpOnly ? '<span class="badge http-only">HttpOnly</span>' : ''}
      ${cookie.session ? '<span class="badge session">Session</span>' : ''}
    </div>
    <button class="cookie-delete"></button>
  `;
    return item;
}

/**
 * Create a schedule item element
 */
export function createScheduleItemElement(schedule) {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
    <div class="schedule-icon"></div>
    <div class="schedule-info">
      <div class="schedule-name">${schedule.name}</div>
      <div class="schedule-details">${schedule.frequency} min</div>
    </div>
    <label class="schedule-toggle">
      <input type="checkbox" ${schedule.enabled ? 'checked' : ''}>
      <span class="toggle-slider"></span>
    </label>
    <button class="schedule-delete"></button>
  `;
    return item;
}