// ========================================
// Modal Component
// ========================================

export class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || 'Modal';
        this.content = options.content || '';
        this.footer = options.footer || '';
        this.size = options.size || 'medium';
        this.closable = options.closable !== false;
        this.onClose = options.onClose || null;
        this.onOpen = options.onOpen || null;

        this.element = null;
        this.overlay = null;
    }

    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.id = `${this.id}-overlay`;

        // Create modal
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.size}`;
        this.element.id = this.id;

        this.element.innerHTML = `
      <div class="modal-header">
        <h3>${this.title}</h3>
        ${this.closable ? `
          <button class="modal-close" data-action="close">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        ` : ''}
      </div>
      <div class="modal-body">${this.content}</div>
            ${this.footer ? `<div class="modal-footer">${this.footer}</div>` : ''}
    `;

        this.overlay.appendChild(this.element);
        document.body.appendChild(this.overlay);

        this.bindEvents();

        return this;
    }

    bindEvents() {
        // Close button
        const closeBtn = this.element.querySelector('[data-action="close"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click
        if (this.closable) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // Escape key
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.closable) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    open() {
        this.overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        if (this.onOpen) {
            this.onOpen(this);
        }

        return this;
    }

    close() {
        this.overlay.classList.remove('show');
        document.body.style.overflow = '';

        if (this.onClose) {
            this.onClose(this);
        }

        // Clean up after animation
        setTimeout(() => {
            this.destroy();
        }, 300);

        return this;
    }

    destroy() {
        document.removeEventListener('keydown', this.escHandler);
        this.overlay.remove();
    }

    setContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
        return this;
    }

    setTitle(title) {
        const titleEl = this.element.querySelector('.modal-header h3');
        if (titleEl) {
            titleEl.textContent = title;
        }
        return this;
    }

    setFooter(footer) {
        let footerEl = this.element.querySelector('.modal-footer');
        if (!footerEl) {
            footerEl = document.createElement('div');
            footerEl.className = 'modal-footer';
            this.element.appendChild(footerEl);
        }
        footerEl.innerHTML = footer;
        return this;
    }

    getElement() {
        return this.element;
    }

    getBody() {
        return this.element.querySelector('.modal-body');
    }
}

/**
 * Confirm dialog helper
 */
export function confirmDialog(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Confirm',
            content: `<p style="margin: 0;">${message}</p>`,
            footer: `
        <button class="btn secondary" data-action="cancel">${options.cancelText || 'Cancel'}</button>
        <button class="btn primary" data-action="confirm">${options.confirmText || 'Confirm'}</button>
      `,
            size: 'small',
            onClose: () => resolve(false)
        });

        modal.create().open();

        modal.getElement().querySelector('[data-action="cancel"]').addEventListener('click', () => {
            modal.close();
            resolve(false);
        });

        modal.getElement().querySelector('[data-action="confirm"]').addEventListener('click', () => {
            modal.close();
            resolve(true);
        });
    });
}

/**
 * Alert dialog helper
 */
export function alertDialog(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Alert',
            content: `<p style="margin: 0;">${message}</p>`,
            footer: `
        <button class="btn primary" data-action="ok">${options.okText || 'OK'}</button>
      `,
            size: 'small',
            onClose: () => resolve()
        });

        modal.create().open();

        modal.getElement().querySelector('[data-action="ok"]').addEventListener('click', () => {
            modal.close();
            resolve();
        });
    });
}

/**
 * Prompt dialog helper
 */
export function promptDialog(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: options.title || 'Input',
            content: `
        <p style="margin: 0 0 12px;">${message}</p>
        <input type="${options.type || 'text'}" class="prompt-input" value="${options.defaultValue || ''}" placeholder="${options.placeholder || ''}">
      `,
            footer: `
        <button class="btn secondary" data-action="cancel">${options.cancelText || 'Cancel'}</button>
        <button class="btn primary" data-action="confirm">${options.confirmText || 'OK'}</button>
      `,
            size: 'small',
            onClose: () => resolve(null)
        });

        modal.create().open();

        const input = modal.getElement().querySelector('.prompt-input');
        input.focus();
        input.select();

        modal.getElement().querySelector('[data-action="cancel"]').addEventListener('click', () => {
            modal.close();
            resolve(null);
        });

        modal.getElement().querySelector('[data-action="confirm"]').addEventListener('click', () => {
            const value = input.value;
            modal.close();
            resolve(value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = input.value;
                modal.close();
                resolve(value);
            }
        });
    });
}