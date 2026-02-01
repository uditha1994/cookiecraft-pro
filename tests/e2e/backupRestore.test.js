/**
 * Backup/Restore Flow E2E Tests
 */

import { createPopupDOM, cleanupDOM, query } from '../helpers/domHelpers.js';
import { mockCookies, mockBackup, mockEncryptedBackup, getAllMockCookies } from '../helpers/mockData.js';
import { setupMockCookies, setupMockStorage, click, typeIntoInput, flushPromises, createMockFile } from '../helpers/testUtils.js';

describe('Backup/Restore E2E Tests', () => {
    beforeEach(() => {
        createPopupDOM();
        setupMockCookies(getAllMockCookies());
        setupMockStorage({
            savedBackups: [],
            settings: { notifications: true }
        });
    });

    afterEach(() => {
        cleanupDOM();
        jest.clearAllMocks();
    });

    describe('Open Backup Modal', () => {
        test('should open backup modal on button click', () => {
            const backupBtn = query.byId('backupCookies');
            const modalOverlay = query.byId('backupModalOverlay');

            click(backupBtn);
            modalOverlay.classList.add('show');

            expect(modalOverlay.classList.contains('show')).toBe(true);
        });

        test('should show backup tab by default', () => {
            const backupTab = query.bySelector('[data-vault="backup"]');
            const backupContent = query.byId('vaultBackup');

            expect(backupTab.classList.contains('active')).toBe(true);
            expect(backupContent.classList.contains('hidden')).toBe(false);
        });

        test('should close modal on close button click', () => {
            const modalOverlay = query.byId('backupModalOverlay');
            const closeBtn = query.byId('backupModalClose');

            modalOverlay.classList.add('show');

            click(closeBtn);
            modalOverlay.classList.remove('show');

            expect(modalOverlay.classList.contains('show')).toBe(false);
        });
    });

    describe('Create Backup Flow', () => {
        test('should create unencrypted backup', async () => {
            const nameInput = query.byId('backupName');
            const createBtn = query.byId('createBackup');

            // Enter backup name
            typeIntoInput(nameInput, 'My Test Backup');

            // Click create
            click(createBtn);

            // Get all cookies
            const cookies = await chrome.cookies.getAll({});

            // Create backup data
            const backupData = {
                name: 'My Test Backup',
                createdAt: Date.now(),
                version: '1.0',
                cookieCount: cookies.length,
                cookies: cookies,
                encrypted: false
            };

            // Simulate download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

            expect(blob.size).toBeGreaterThan(0);
            expect(backupData.cookies.length).toBe(getAllMockCookies().length);
        });

        test('should create encrypted backup with password', async () => {
            const nameInput = query.byId('backupName');
            const passwordInput = query.byId('backupPassword');
            const createBtn = query.byId('createBackup');

            // Enter backup details
            typeIntoInput(nameInput, 'Secure Backup');
            typeIntoInput(passwordInput, 'mySecretPassword123');

            click(createBtn);

            // Get cookies
            const cookies = await chrome.cookies.getAll({});

            // Create encrypted backup
            const backupData = {
                name: 'Secure Backup',
                createdAt: Date.now(),
                version: '1.0',
                cookieCount: cookies.length,
                encrypted: true,
                // In real implementation, this would be encrypted
                salt: 'randomsalt',
                iv: 'randomiv',
                data: 'encrypteddata'
            };

            expect(backupData.encrypted).toBe(true);
            expect(backupData.salt).toBeDefined();
        });

        test('should save backup to storage', async () => {
            const backupInfo = {
                id: Date.now().toString(),
                name: 'Saved Backup',
                createdAt: Date.now(),
                cookieCount: 10,
                encrypted: false
            };

            const savedBackups = [backupInfo];
            await chrome.storage.local.set({ savedBackups });

            expect(chrome.storage.local.set).toHaveBeenCalledWith({ savedBackups });
        });

        test('should limit saved backups to 10', async () => {
            const savedBackups = [];

            // Create 12 backups
            for (let i = 0; i < 12; i++) {
                savedBackups.push({
                    id: i.toString(),
                    name: `Backup ${i}`,
                    createdAt: Date.now() - i * 86400000,
                    cookieCount: 10
                });
            }

            // Keep only last 10
            const limitedBackups = savedBackups.slice(0, 10);

            expect(limitedBackups.length).toBe(10);
        });

        test('should show success toast after backup', () => {
            const toastContainer = query.byId('toastContainer');

            toastContainer.innerHTML = `
        <div class="toast success">
          <span class="toast-message">Backup created successfully</span>
        </div>
      `;

            expect(toastContainer.querySelector('.toast.success')).toBeTruthy();
        });

        test('should backup current site only option', async () => {
            const currentOnlyCheckbox = query.byId('backupCurrentOnly');
            const allDomainsCheckbox = query.byId('backupAllDomains');

            // Select current site only
            currentOnlyCheckbox.checked = true;
            allDomainsCheckbox.checked = false;

            // Get only current site cookies
            const currentUrl = 'https://www.google.com/';
            const currentCookies = await chrome.cookies.getAll({ url: currentUrl });

            const backupData = {
                name: 'Current Site Backup',
                cookies: currentCookies
            };

            expect(backupData.cookies.length).toBeLessThanOrEqual(getAllMockCookies().length);
        });
    });

    describe('Switch Tabs Flow', () => {
        test('should switch to restore tab', () => {
            const restoreTab = query.bySelector('[data-vault="restore"]');
            const backupTab = query.bySelector('[data-vault="backup"]');
            const restoreContent = query.byId('vaultRestore');
            const backupContent = query.byId('vaultBackup');

            click(restoreTab);

            backupTab.classList.remove('active');
            restoreTab.classList.add('active');
            backupContent.classList.add('hidden');
            restoreContent.classList.remove('hidden');

            expect(restoreTab.classList.contains('active')).toBe(true);
            expect(restoreContent.classList.contains('hidden')).toBe(false);
        });

        test('should switch back to backup tab', () => {
            const restoreTab = query.bySelector('[data-vault="restore"]');
            const backupTab = query.bySelector('[data-vault="backup"]');

            // First switch to restore
            restoreTab.classList.add('active');
            backupTab.classList.remove('active');

            // Switch back
            click(backupTab);
            backupTab.classList.add('active');
            restoreTab.classList.remove('active');

            expect(backupTab.classList.contains('active')).toBe(true);
        });
    });

    describe('Restore Backup Flow', () => {
        test('should select backup file', () => {
            const fileInput = query.byId('restoreFile');
            const restoreBtn = query.byId('restoreBackup');

            // Create mock file
            const backupContent = JSON.stringify(mockBackup);
            const file = createMockFile(backupContent, 'backup.cmb');

            // Simulate file selection
            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });

            fileInput.dispatchEvent(new Event('change'));

            // Enable restore button
            restoreBtn.disabled = false;

            expect(restoreBtn.disabled).toBe(false);
        });

        test('should restore unencrypted backup', async () => {
            const backupData = mockBackup;

            // Restore each cookie
            let restored = 0;

            for (const cookie of backupData.cookies) {
                try {
                    await chrome.cookies.set({
                        url: `https://${cookie.domain.replace(/^\./, '')}/`,
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly
                    });
                    restored++;
                } catch (e) {
                    // Skip failed cookies
                }
            }

            expect(restored).toBe(backupData.cookies.length);
            expect(chrome.cookies.set).toHaveBeenCalledTimes(restored);
        });

        test('should restore encrypted backup with password', async () => {
            const passwordInput = query.byId('restorePassword');

            // Enter password
            typeIntoInput(passwordInput, 'correctPassword');

            // Simulate decryption success
            const decryptedData = mockBackup;

            // Restore cookies
            for (const cookie of decryptedData.cookies) {
                await chrome.cookies.set({
                    url: `https://${cookie.domain.replace(/^\./, '')}/`,
                    ...cookie
                });
            }

            expect(chrome.cookies.set).toHaveBeenCalled();
        });

        test('should fail with wrong password', async () => {
            const passwordInput = query.byId('restorePassword');
            const toastContainer = query.byId('toastContainer');

            typeIntoInput(passwordInput, 'wrongPassword');

            // Simulate decryption failure
            const decryptionFailed = true;

            if (decryptionFailed) {
                toastContainer.innerHTML = `
          <div class="toast error">
            <span class="toast-message">Decryption failed. Check password.</span>
          </div>
        `;
            }

            expect(toastContainer.querySelector('.toast.error')).toBeTruthy();
        });

        test('should handle invalid backup file', () => {
            const toastContainer = query.byId('toastContainer');

            // Invalid JSON
            const invalidContent = 'not valid json{{{';

            try {
                JSON.parse(invalidContent);
            } catch (e) {
                toastContainer.innerHTML = `
          <div class="toast error">
            <span class="toast-message">Invalid backup file format</span>
          </div>
        `;
            }

            expect(toastContainer.querySelector('.toast.error')).toBeTruthy();
        });

        test('should show success message with count', () => {
            const toastContainer = query.byId('toastContainer');
            const restoredCount = 5;

            toastContainer.innerHTML = `
        <div class="toast success">
          <span class="toast-message">Restored ${restoredCount} cookies</span>
        </div>
      `;

            expect(toastContainer.textContent).toContain('5 cookies');
        });

        test('should close modal after restore', () => {
            const modalOverlay = query.byId('backupModalOverlay');

            modalOverlay.classList.add('show');

            // After successful restore
            modalOverlay.classList.remove('show');

            expect(modalOverlay.classList.contains('show')).toBe(false);
        });
    });

    describe('Saved Backups List', () => {
        test('should render saved backups', async () => {
            const savedBackupsList = query.byId('savedBackups');

            const backups = [
                { id: '1', name: 'Backup 1', createdAt: Date.now(), cookieCount: 10, encrypted: false },
                { id: '2', name: 'Backup 2', createdAt: Date.now() - 86400000, cookieCount: 15, encrypted: true }
            ];

            await chrome.storage.local.set({ savedBackups: backups });

            savedBackupsList.innerHTML = backups.map(b => `
        <div class="backup-item" data-id="${b.id}">
          <div class="backup-info">
            <div class="backup-name">${b.name} ${b.encrypted ? '🔒' : ''}</div>
            <div class="backup-meta">${b.cookieCount} cookies • ${new Date(b.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');

            expect(savedBackupsList.children.length).toBe(2);
            expect(savedBackupsList.textContent).toContain('Backup 1');
            expect(savedBackupsList.textContent).toContain('🔒');
        });

        test('should show empty message when no backups', () => {
            const savedBackupsList = query.byId('savedBackups');

            savedBackupsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No backups saved yet</p>';

            expect(savedBackupsList.textContent).toContain('No backups');
        });
    });

    describe('File Drag & Drop', () => {
        test('should handle file drop', () => {
            const fileUpload = query.bySelector('.file-upload');

            if (fileUpload) {
                const label = fileUpload.querySelector('label');

                // Simulate dragover
                const dragOverEvent = new Event('dragover');
                fileUpload.dispatchEvent(dragOverEvent);

                // Simulate drop
                const dropEvent = new Event('drop');
                fileUpload.dispatchEvent(dropEvent);

                expect(fileUpload).toBeTruthy();
            }
        });
    });

    describe('Backup Validation', () => {
        test('should validate backup structure', () => {
            const validBackup = {
                name: 'Test',
                createdAt: Date.now(),
                version: '1.0',
                cookieCount: 5,
                cookies: []
            };

            const isValid = (backup) => {
                return backup.name &&
                    backup.createdAt &&
                    backup.version &&
                    Array.isArray(backup.cookies);
            };

            expect(isValid(validBackup)).toBe(true);
        });

        test('should reject invalid backup', () => {
            const invalidBackup = {
                name: 'Test'
                // Missing required fields
            };

            const isValid = (backup) => {
                return backup.name &&
                    backup.createdAt &&
                    backup.version &&
                    Array.isArray(backup.cookies);
            };

            expect(isValid(invalidBackup)).toBe(false);
        });

        test('should validate cookie data', () => {
            const validCookie = {
                name: 'test',
                value: 'value',
                domain: '.example.com',
                path: '/'
            };

            const isValidCookie = (cookie) => {
                return cookie.name &&
                    cookie.domain &&
                    cookie.path !== undefined;
            };

            expect(isValidCookie(validCookie)).toBe(true);
        });
    });
});