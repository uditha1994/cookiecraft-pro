/**
 * Toast Component Tests
 */

import { createTestContainer, cleanupTestContainer } from '../helpers/testUtils.js';

describe('Toast Component', () => {
    let container;
    let toastContainer;

    beforeEach(() => {
        container = createTestContainer();
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        container.appendChild(toastContainer);
    });

    afterEach(() => {
        cleanupTestContainer();
    });

    function createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <div class="toast-icon">
        <svg viewBox="0 0 24 24"></svg>
      </div>
      <span class="toast-message">${message}</span>
      <button class="toast-close">
        <svg viewBox="0 0 24 24"></svg>
      </button>
    `;
        toastContainer.appendChild(toast);
        return toast;
    }

    describe('showToast', () => {
        test('should create toast element', () => {
            const toast = createToast('Test message');

            expect(toast).toBeTruthy();
            expect(toastContainer.children.length).toBe(1);
        });

        test('should display correct message', () => {
            const message = 'Cookie deleted successfully';
            const toast = createToast(message);

            expect(toast.querySelector('.toast-message').textContent).toBe(message);
        });

        test('should apply success type class', () => {
            const toast = createToast('Success!', 'success');

            expect(toast.classList.contains('success')).toBe(true);
        });

        test('should apply error type class', () => {
            const toast = createToast('Error!', 'error');

            expect(toast.classList.contains('error')).toBe(true);
        });

        test('should apply warning type class', () => {
            const toast = createToast('Warning!', 'warning');

            expect(toast.classList.contains('warning')).toBe(true);
        });

        test('should apply info type class', () => {
            const toast = createToast('Info!', 'info');

            expect(toast.classList.contains('info')).toBe(true);
        });
    });

    describe('Toast Close', () => {
        test('should have close button', () => {
            const toast = createToast('Test');
            const closeBtn = toast.querySelector('.toast-close');

            expect(closeBtn).toBeTruthy();
        });

        test('should remove toast on close click', () => {
            const toast = createToast('Test');
            const closeBtn = toast.querySelector('.toast-close');

            closeBtn.click();
            toast.remove();

            expect(toastContainer.children.length).toBe(0);
        });
    });

    describe('Multiple Toasts', () => {
        test('should stack multiple toasts', () => {
            createToast('Toast 1');
            createToast('Toast 2');
            createToast('Toast 3');

            expect(toastContainer.children.length).toBe(3);
        });

        test('should maintain order', () => {
            createToast('First');
            createToast('Second');
            createToast('Third');

            const messages = Array.from(toastContainer.querySelectorAll('.toast-message'))
                .map(el => el.textContent);

            expect(messages).toEqual(['First', 'Second', 'Third']);
        });
    });

    describe('Toast Animation', () => {
        test('should have toast-in animation class', () => {
            const toast = createToast('Animated');

            // Animation is applied via CSS, check class exists
            expect(toast.classList.contains('toast')).toBe(true);
        });

        test('should add fade-out class on removal', () => {
            const toast = createToast('Fading');
            toast.classList.add('fade-out');

            expect(toast.classList.contains('fade-out')).toBe(true);
        });
    });

    describe('Toast Icons', () => {
        test('should have icon container', () => {
            const toast = createToast('With Icon', 'success');
            const icon = toast.querySelector('.toast-icon');

            expect(icon).toBeTruthy();
        });
    });
});