// ========================================
// CookieCraft Pro - Background Service Worker
// ========================================

import { CookieManager } from '../utils/cookieManager.js';
import { CacheManager } from '../utils/cacheManager.js';
import { StorageManager } from '../utils/storageManager.js';
import { recordDailyStats } from '../utils/analytics.js';

const cookieManager = new CookieManager();
const cacheManager = new CacheManager();
const storageManager = new StorageManager();

// ========================================
// Installation & Startup
// ========================================

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('CookieCraft Pro installed:', details.reason);

    if (details.reason === 'install') {
        // Set default settings
        await storageManager.set('settings', {
            theme: 'light',
            notifications: true,
            autoCleanOnClose: false,
            trackingProtection: true,
            showBadge: true
        });

        // Initialize schedules
        await storageManager.set('schedules', []);

        // Initialize cookie history
        await storageManager.set('cookieHistory', []);

        // Open welcome page
        chrome.tabs.create({
            url: 'dashboard/dashboard.html?welcome=true'
        });
    }

    if (details.reason === 'update') {
        console.log('Updated from version:', details.previousVersion);
    }

    // Create context menus
    createContextMenus();

    // Restore alarms for schedules
    await restoreScheduleAlarms();

    // Update badge
    await updateBadge();

    // Create daily stats alarm
    chrome.alarms.create('dailyStats', {
        periodInMinutes: 60 * 24 // Once per day
    });
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('CookieCraft Pro started');

    // Restore schedule alarms
    await restoreScheduleAlarms();

    // Record daily stats
    await recordDailyStats();

    // Update badge
    await updateBadge();
});

// ========================================
// Context Menu Setup
// ========================================

function createContextMenus() {
    // Remove existing menus first to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'clearSiteCookies',
            title: 'Clear cookies for this site',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'viewSiteCookies',
            title: 'View cookies for this site',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'separator',
            type: 'separator',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'openDashboard',
            title: 'Open CookieCraft Dashboard',
            contexts: ['page']
        });
    });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        switch (info.menuItemId) {
            case 'clearSiteCookies':
                if (tab && tab.url) {
                    const url = new URL(tab.url);
                    await cookieManager.deleteCookiesForDomain(url.hostname);

                    const settings = await storageManager.get('settings') || {};
                    if (settings.notifications !== false) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'assets/icons/cookies.png',
                            title: 'CookieCraft Pro',
                            message: `Cookies cleared for ${url.hostname}`
                        });
                    }

                    await updateBadge();
                }
                break;

            case 'viewSiteCookies':
                // Open popup - note: openPopup() may not work in all contexts
                // Alternative: open dashboard with site filter
                if (tab && tab.url) {
                    const url = new URL(tab.url);
                    chrome.tabs.create({
                        url: `dashboard/dashboard.html?domain=${encodeURIComponent(url.hostname)}`
                    });
                }
                break;

            case 'openDashboard':
                chrome.runtime.openOptionsPage();
                break;
        }
    } catch (error) {
        console.error('Context menu action error:', error);
    }
});

// ========================================
// Message Handling
// ========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
        .then(response => {
            sendResponse(response);
        })
        .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({ error: error.message });
        });

    return true; // Keep message channel open for async response
});

async function handleMessage(message, sender) {
    switch (message.action) {
        case 'getCookies':
            return await cookieManager.getCookiesForUrl(message.url);

        case 'getAllCookies':
            return await cookieManager.getAllCookies();

        case 'deleteCookie':
            return await cookieManager.deleteCookie(message.cookie);

        case 'clearCookiesForDomain':
            return await cookieManager.deleteCookiesForDomain(message.domain);

        case 'clearAllCookies':
            return await cookieManager.clearAllCookies();

        case 'clearBrowsingData':
            return await cacheManager.clearBrowsingData(message.options, message.since);

        case 'createSchedule':
            return await createScheduleAlarm(message.schedule);

        case 'enableSchedule':
            return await enableScheduleAlarm(message.scheduleId);

        case 'disableSchedule':
            return await disableScheduleAlarm(message.scheduleId);

        case 'deleteSchedule':
            return await deleteScheduleAlarm(message.scheduleId);

        case 'getStatistics':
            return await cookieManager.getStatistics();

        case 'updateBadge':
            return await updateBadge();

        case 'exportCookies':
            return await cookieManager.exportCookies(message.options);

        case 'importCookies':
            return await cookieManager.importCookies(message.data, message.options);

        // Debug actions
        case 'listAlarms':
            return await listAllAlarms();

        case 'clearAllAlarms':
            return await clearAllScheduleAlarms();

        case 'getSettings':
            return await storageManager.get('settings');

        case 'getSchedules':
            return await storageManager.get('schedules');

        default:
            throw new Error(`Unknown action: ${message.action}`);
    }
}

// ========================================
// Cookie Change Listener
// ========================================

chrome.cookies.onChanged.addListener(async (changeInfo) => {
    const { removed, cookie, cause } = changeInfo;

    try {
        // Update badge count
        await updateBadge();

        // Log cookie changes for analytics
        const today = new Date().toDateString();
        const history = await storageManager.get('cookieHistory') || [];
        let todayEntry = history.find(h => h.date === today);

        if (!todayEntry) {
            todayEntry = { date: today, count: 0, added: 0, removed: 0 };
            history.push(todayEntry);
        }

        if (removed) {
            todayEntry.removed++;
        } else {
            todayEntry.added++;
        }

        // Update count
        const allCookies = await cookieManager.getAllCookies();
        todayEntry.count = allCookies.length;

        // Keep only last 30 days
        while (history.length > 30) {
            history.shift();
        }

        await storageManager.set('cookieHistory', history);

        // Check for tracking cookie and notify if enabled
        const settings = await storageManager.get('settings') || {};
        if (settings.trackingProtection && !removed) {
            const isTracking = isTrackingCookie(cookie);
            if (isTracking && settings.notifications) {
                // Optionally show notification for tracking cookies
                // Uncomment below if you want notifications for each tracking cookie
                /*
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'assets/icons/icon128.png',
                  title: 'Tracking Cookie Detected',
                  message: `${cookie.name} from ${cookie.domain}`
                });
                */
            }
        }
    } catch (error) {
        console.error('Cookie change handler error:', error);
    }
});

function isTrackingCookie(cookie) {
    const trackingPatterns = [
        '_ga', '_gid', '_gat', '_fbp', '_fbc', 'doubleclick',
        'adsense', 'criteo', 'outbrain', 'taboola', 'amplitude',
        'mixpanel', 'segment', 'hotjar', 'clarity', 'analytics',
        'tracking', 'pixel', 'adwords', 'facebook', 'google_ads'
    ];

    const cookieStr = (cookie.name + cookie.domain).toLowerCase();
    return trackingPatterns.some(pattern => cookieStr.includes(pattern));
}

// ========================================
// Schedule Management
// ========================================

async function createScheduleAlarm(schedule) {
    try {
        const alarmName = `schedule_${schedule.id}`;

        await chrome.alarms.create(alarmName, {
            periodInMinutes: schedule.frequency
        });

        console.log(`Created alarm: ${alarmName} with period: ${schedule.frequency} minutes`);

        return { success: true };
    } catch (error) {
        console.error('Error creating schedule alarm:', error);
        return { success: false, error: error.message };
    }
}

async function enableScheduleAlarm(scheduleId) {
    try {
        const schedules = await storageManager.get('schedules') || [];
        const schedule = schedules.find(s => s.id === scheduleId);

        if (schedule) {
            await createScheduleAlarm(schedule);
        }

        return { success: true };
    } catch (error) {
        console.error('Error enabling schedule alarm:', error);
        return { success: false, error: error.message };
    }
}

async function disableScheduleAlarm(scheduleId) {
    try {
        const alarmName = `schedule_${scheduleId}`;
        await chrome.alarms.clear(alarmName);

        console.log(`Disabled alarm: ${alarmName}`);

        return { success: true };
    } catch (error) {
        console.error('Error disabling schedule alarm:', error);
        return { success: false, error: error.message };
    }
}

async function deleteScheduleAlarm(scheduleId) {
    try {
        const alarmName = `schedule_${scheduleId}`;
        await chrome.alarms.clear(alarmName);

        console.log(`Deleted alarm: ${alarmName}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting schedule alarm:', error);
        return { success: false, error: error.message };
    }
}

async function restoreScheduleAlarms() {
    try {
        const schedules = await storageManager.get('schedules') || [];

        // Clear all existing schedule alarms first
        const existingAlarms = await chrome.alarms.getAll();
        for (const alarm of existingAlarms) {
            if (alarm.name.startsWith('schedule_')) {
                await chrome.alarms.clear(alarm.name);
            }
        }

        // Recreate alarms for enabled schedules
        for (const schedule of schedules) {
            if (schedule.enabled) {
                await createScheduleAlarm(schedule);
            }
        }

        console.log(`Restored ${schedules.filter(s => s.enabled).length} schedule alarms`);
    } catch (error) {
        console.error('Error restoring schedule alarms:', error);
    }
}

// ========================================
// Alarm Listener
// ========================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('Alarm triggered:', alarm.name);

    try {
        if (alarm.name.startsWith('schedule_')) {
            const scheduleId = alarm.name.replace('schedule_', '');
            await executeSchedule(scheduleId);
        }

        if (alarm.name === 'dailyStats') {
            await recordDailyStats();
        }
    } catch (error) {
        console.error('Alarm handler error:', error);
    }
});

async function executeSchedule(scheduleId) {
    console.log('=== SCHEDULE EXECUTION START ===');
    console.log('Schedule ID:', scheduleId);

    const schedules = await storageManager.get('schedules') || [];
    console.log('All schedules:', schedules);

    const schedule = schedules.find(s => s.id === scheduleId);

    if (!schedule) {
        console.log('Schedule not found:', scheduleId);
        return;
    }

    if (!schedule.enabled) {
        console.log('Schedule is disabled:', scheduleId);
        return;
    }

    console.log('Executing schedule:', schedule.name);
    console.log('Schedule targets:', schedule.targets);
    console.log('Schedule domain:', schedule.domain);

    try {
        let clearedItems = [];

        // Clear cookies if enabled
        if (schedule.targets && schedule.targets.cookies) {
            console.log('Clearing cookies...');
            if (schedule.domain) {
                await cookieManager.deleteCookiesForDomain(schedule.domain);
                clearedItems.push('cookies for ' + schedule.domain);
            } else {
                await cookieManager.clearAllCookies();
                clearedItems.push('all cookies');
            }
        }

        // Clear cache if enabled
        if (schedule.targets && schedule.targets.cache) {
            console.log('Clearing cache...');
            await cacheManager.clearCache();
            clearedItems.push('cache');
        }

        // Clear history if enabled
        if (schedule.targets && schedule.targets.history) {
            console.log('Clearing history...');
            await cacheManager.clearHistory();
            clearedItems.push('history');
        }

        // Update badge
        await updateBadge();

        // Show notification
        const settings = await storageManager.get('settings') || {};
        if (settings.notifications !== false && clearedItems.length > 0) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon128.png',
                title: 'CookieCraft Pro',
                message: `Schedule "${schedule.name}" completed. Cleared: ${clearedItems.join(', ')}`
            });
        }

        console.log('Schedule executed successfully:', schedule.name);
        console.log('Cleared items:', clearedItems);
        console.log('=== SCHEDULE EXECUTION END ===');

    } catch (error) {
        console.error('Schedule execution error:', error);

        const settings = await storageManager.get('settings') || {};
        if (settings.notifications !== false) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon128.png',
                title: 'CookieCraft Pro - Error',
                message: `Schedule "${schedule.name}" failed: ${error.message}`
            });
        }
    }
}

// ========================================
// Badge Management
// ========================================

async function updateBadge() {
    try {
        const settings = await storageManager.get('settings') || {};

        if (settings.showBadge === false) {
            await chrome.action.setBadgeText({ text: '' });
            return;
        }

        const cookies = await cookieManager.getAllCookies();
        const count = cookies.length;

        let badgeText = '';
        if (count > 999) {
            badgeText = '999+';
        } else if (count > 0) {
            badgeText = count.toString();
        }

        await chrome.action.setBadgeText({ text: badgeText });
        await chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
        await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });

    } catch (error) {
        console.error('Badge update error:', error);
    }
}

// ========================================
// Tab Events
// ========================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        try {
            await updateBadge();
        } catch (error) {
            console.error('Tab update handler error:', error);
        }
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        await updateBadge();
    } catch (error) {
        console.error('Tab activation handler error:', error);
    }
});

// ========================================
// Window Events (for auto-clean on close)
// ========================================

chrome.windows.onRemoved.addListener(async (windowId) => {
    try {
        // Check if this is the last window
        const windows = await chrome.windows.getAll();

        if (windows.length === 0) {
            const settings = await storageManager.get('settings') || {};

            // Only auto-clean if explicitly enabled by user
            if (settings.autoCleanOnClose === true) {
                console.log('Auto-cleaning on browser close...');

                // Log what we're about to do
                console.log('Settings autoCleanOnClose:', settings.autoCleanOnClose);

                await cookieManager.clearAllCookies();
                await cacheManager.clearCache();

                console.log('Auto-clean completed');
            } else {
                console.log('Auto-clean on close is disabled, skipping...');
            }
        }
    } catch (error) {
        console.error('Window remove handler error:', error);
    }
});

// ========================================
// Extension Suspend/Wake (MV3)
// ========================================

// Keep service worker alive for critical operations
const keepAlive = () => {
    setInterval(() => {
        chrome.storage.local.get(['keepAlive'], () => {
            // This keeps the service worker active
        });
    }, 20000);
};

async function clearAllScheduleAlarms() {
    try {
        const existingAlarms = await chrome.alarms.getAll();
        console.log('Existing alarms:', existingAlarms);

        for (const alarm of existingAlarms) {
            if (alarm.name.startsWith('schedule_')) {
                await chrome.alarms.clear(alarm.name);
                console.log('Cleared alarm:', alarm.name);
            }
        }

        console.log('All schedule alarms cleared');
        return { success: true };
    } catch (error) {
        console.error('Error clearing alarms:', error);
        return { success: false, error: error.message };
    }
}

async function listAllAlarms() {
    const alarms = await chrome.alarms.getAll();
    console.log('=== ALL ACTIVE ALARMS ===');
    alarms.forEach(alarm => {
        console.log(`Alarm: ${alarm.name}, Period: ${alarm.periodInMinutes} min, Next: ${new Date(alarm.scheduledTime).toLocaleString()}`);
    });
    return alarms;
}

// Initialize on script load
console.log('CookieCraft Pro background service worker initialized');

// Initial badge update
updateBadge().catch(console.error);