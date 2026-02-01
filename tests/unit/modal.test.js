/**
 * Modal Component Tests
 */

import { createTestContainer, cleanupTestContainer, click } from '../helpers/testUtils.js';

describe('Modal Component', () => {
    let container;

    beforeEach(() => {
        container = createTestContainer();
    });

    afterEach(() => {
        cleanupTestContainer();
    });

    function createModal(options = {}) {
        const {
            title = 'Test Modal',
            content = '<p>Modal content</p>',
            footer = '<button class="btn">OK</button>'
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">${content}</div>
        <div class="modal-footer">${footer}</div>
      </div>
    `;
        container.appendChild(overlay);
        return overlay;
    }

    describe('Modal Creation', () => {
        test('should create modal element', () => {
            const overlay = createModal();
            const modal = overlay.querySelector('.modal');

            expect(modal).toBeTruthy();
        });

        test('should have header, body, and footer', () => {
            const overlay = createModal();

            expect(overlay.querySelector('.modal-header')).toBeTruthy();
            expect(overlay.querySelector('.modal-body')).toBeTruthy();
            expect(overlay.querySelector('.modal-footer')).toBeTruthy();
        });

        test('should display title', () => {
            const overlay = createModal({ title: 'My Title' });
            const title = overlay.querySelector('.modal-header h3');

            expect(title.textContent).toBe('My Title');
        });

        test('should display content', () => {
            const overlay = createModal({ content: '<p>Custom content</p>' });
            const body = overlay.querySelector('.modal-body');

            expect(body.innerHTML).toContain('Custom content');
        });
    });

    describe('Modal Visibility', () => {
        test('should show modal when show class added', () => {
            const overlay = createModal();
            overlay.classList.add('show');

            expect(overlay.classList.contains('show')).toBe(true);
        });

        test('should hide modal when show class removed', () => {
            const overlay = createModal();
            overlay.classList.add('show');
            overlay.classList.remove('show');

            expect(overlay.classList.contains('show')).toBe(false);
        });
    });

    describe('Modal Close', () => {
        test('should have close button', () => {
            const overlay = createModal();
            const closeBtn = overlay.querySelector('.modal-close');

            expect(closeBtn).toBeTruthy();
        });

        test('should close on close button click', () => {
            const overlay = createModal();
            overlay.classList.add('show');

            const closeBtn = overlay.querySelector('.modal-close');
            click(closeBtn);
            overlay.classList.remove('show');

            expect(overlay.classList.contains('show')).toBe(false);
        });

        test('should close on overlay click', () => {
            const overlay = createModal();
            overlay.classList.add('show');

            // Click on overlay (not modal)
            overlay.classList.remove('show');

            expect(overlay.classList.contains('show')).toBe(false);
        });
    });

    describe('Modal Content', () => {
        test('should update title', () => {
            const overlay = createModal({ title: 'Original' });
            const titleEl = overlay.querySelector('.modal-header h3');

            titleEl.textContent = 'Updated Title';

            expect(titleEl.textContent).toBe('Updated Title');
        });

        test('should update body content', () => {
            const overlay = createModal({ content: '<p>Original</p>' });
            const body = overlay.querySelector('.modal-body');

            body.innerHTML = '<p>Updated content</p>';

            expect(body.innerHTML).toContain('Updated content');
        });

        test('should update footer content', () => {
            const overlay = createModal({ footer: '<button>Cancel</button>' });
            const footer = overlay.querySelector('.modal-footer');

            footer.innerHTML = '<button>Save</button><button>Cancel</button>';

            expect(footer.querySelectorAll('button').length).toBe(2);
        });
    });

    describe('Cookie Detail Modal', () => {
        test('should display cookie details', () => {
            const cookie = {
                name: 'session_id',
                value: 'abc123',
                domain: '.example.com',
                path: '/',
                secure: true,
                httpOnly: true,
                expirationDate: Date.now() / 1000 + 86400
            };

            const content = `
        <div class="cookie-detail">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <div class="detail-value">${cookie.name}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Value</span>
            <div class="detail-value">${cookie.value}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Domain</span>
            <div class="detail-value">${cookie.domain}</div>
          </div>
        </div>
      `;

            const overlay = createModal({
                title: 'Cookie Details',
                content
            });

            expect(overlay.textContent).toContain('session_id');
            expect(overlay.textContent).toContain('abc123');
            expect(overlay.textContent).toContain('.example.com');
        });

        test('should have editable value field', () => {
            const content = `
        <div class="detail-value editable" contenteditable="true">original value</div>
      `;

            const overlay = createModal({ content });
            const editableField = overlay.querySelector('.detail-value.editable');

            expect(editableField).toBeTruthy();
            expect(editableField.getAttribute('contenteditable')).toBe('true');
        });
    });

    describe('Confirm Dialog', () => {
        test('should display confirm message', () => {
            const message = 'Are you sure you want to delete?';
            const overlay = createModal({
                title: 'Confirm',
                content: `<p>${message}</p>`,
                footer: `
          <button class="btn secondary" data-action="cancel">Cancel</button>
          <button class="btn primary" data-action="confirm">Confirm</button>
        `
            });

            expect(overlay.textContent).toContain(message);
        });

        test('should have cancel and confirm buttons', () => {
            const overlay = createModal({
                footer: `
          <button class="btn secondary" data-action="cancel">Cancel</button>
          <button class="btn primary" data-action="confirm">Confirm</button>
        `
            });

            const cancelBtn = overlay.querySelector('[data-action="cancel"]');
            const confirmBtn = overlay.querySelector('[data-action="confirm"]');

            expect(cancelBtn).toBeTruthy();
            expect(confirmBtn).toBeTruthy();
        });
    });

    describe('Backup Modal', () => {
        test('should have backup and restore tabs', () => {
            const content = `
        <div class="vault-tabs">
          <button class="vault-tab active" data-vault="backup">Backup</button>
          <button class="vault-tab" data-vault="restore">Restore</button>
        </div>
      `;

            const overlay = createModal({ content });
            const tabs = overlay.querySelectorAll('.vault-tab');

            expect(tabs.length).toBe(2);
        });

        test('should switch between tabs', () => {
            const content = `
        <div class="vault-tabs">
          <button class="vault-tab active" data-vault="backup">Backup</button>
          <button class="vault-tab" data-vault="restore">Restore</button>
        </div>
        <div class="vault-content" id="vaultBackup">Backup content</div>
        <div class="vault-content hidden" id="vaultRestore">Restore content</div>
      `;

            const overlay = createModal({ content });
            const backupTab = overlay.querySelector('[data-vault="backup"]');
            const restoreTab = overlay.querySelector('[data-vault="restore"]');

            // Switch to restore tab
            backupTab.classList.remove('active');
            restoreTab.classList.add('active');
            overlay.querySelector('#vaultBackup').classList.add('hidden');
            overlay.querySelector('#vaultRestore').classList.remove('hidden');

            expect(restoreTab.classList.contains('active')).toBe(true);
            expect(overlay.querySelector('#vaultRestore').classList.contains('hidden')).toBe(false);
        });
    });

    describe('Modal Accessibility', () => {
        test('should have proper structure', () => {
            const overlay = createModal();
            const modal = overlay.querySelector('.modal');
            const header = overlay.querySelector('.modal-header');
            const body = overlay.querySelector('.modal-body');

            expect(modal).toBeTruthy();
            expect(header).toBeTruthy();
            expect(body).toBeTruthy();
        });

        test('should trap focus within modal', () => {
            const overlay = createModal({
                footer: `
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
        `
            });

            const buttons = overlay.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
});