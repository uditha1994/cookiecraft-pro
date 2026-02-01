/**
 * Test Utility Functions
 */

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition, options = {}) {
    const { timeout = 5000, interval = 50 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('waitFor timeout');
}

/**
 * Wait for DOM element to appear
 */
export async function waitForElement(selector, container = document, options = {}) {
    return waitFor(() => {
        const element = container.querySelector(selector);
        return element !== null;
    }, options);
}

/**
 * Simulate user typing
 */
export function typeIntoInput(input, text) {
    input.value = '';
    input.focus();

    for (const char of text) {
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulate click event
 */
export function click(element) {
    element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}

/**
 * Simulate hover
 */
export function hover(element) {
    element.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}

/**
 * Create a mock file
 */
export function createMockFile(content, name = 'test.json', type = 'application/json') {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
}

/**
 * Create a mock FileList
 */
export function createMockFileList(files) {
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    return dt.files;
}

/**
 * Mock fetch response
 */
export function mockFetch(response, options = {}) {
    const { ok = true, status = 200 } = options;

    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
            blob: () => Promise.resolve(new Blob([JSON.stringify(response)]))
        })
    );
}

/**
 * Flush all pending promises
 */
export function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

/**
 * Run all timers and flush promises
 */
export async function runAllTimers() {
    jest.runAllTimers();
    await flushPromises();
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/**
 * Setup mock Chrome cookies
 */
export function setupMockCookies(cookies) {
    chrome.cookies._setCookies(cookies);
}

/**
 * Setup mock Chrome storage
 */
export function setupMockStorage(data) {
    chrome.storage.local._setStore(data);
}

/**
 * Get all Chrome cookies
 */
export function getMockCookies() {
    return chrome.cookies._getCookies();
}

/**
 * Get Chrome storage data
 */
export function getMockStorage() {
    return chrome.storage.local._getStore();
}

/**
 * Assert that a toast notification was shown
 */
export function expectToast(container, message, type = null) {
    const toasts = container.querySelectorAll('.toast');
    const toast = Array.from(toasts).find(t =>
        t.textContent.includes(message)
    );

    expect(toast).toBeTruthy();

    if (type) {
        expect(toast.classList.contains(type)).toBe(true);
    }
}

/**
 * Create test DOM structure
 */
export function createTestContainer() {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Clean up test DOM
 */
export function cleanupTestContainer() {
    const container = document.getElementById('test-container');
    if (container) {
        container.remove();
    }
}

/**
 * Mock console methods
 */
export function mockConsole() {
    const originalConsole = { ...console };

    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.info = jest.fn();

    return () => {
        Object.assign(console, originalConsole);
    };
}