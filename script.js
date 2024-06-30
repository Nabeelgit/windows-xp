let windows = {};

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-button');
    startMenu = document.querySelector('.start-menu');
    taskbarWindows = document.querySelector('.taskbar-windows');

    // Start menu toggle
    if (startButton && startMenu) {
        startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
                startMenu.classList.remove('show');
            }
        });
    }

    // Desktop icon functionality for double-click
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    desktopIcons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            if (windowId) {
                openWindow(windowId);
            }
        });
    });

    // Settings menu item functionality
    const settingsMenuItem = document.querySelector('.start-menu-item:nth-child(2)');
    settingsMenuItem.addEventListener('click', () => {
        openWindow('settings-window');
    });

    const shutDownOption = startMenu.querySelector('.start-menu-item:last-child');
    const sleepOption = startMenu.querySelector('.start-menu-item:nth-child(3)');
    const restartOption = startMenu.querySelector('.start-menu-item:nth-child(4)');

    shutDownOption.addEventListener('click', showShutdownScreen);
    sleepOption.addEventListener('click', showBlackScreen);
    restartOption.addEventListener('click', showRestartScreen);

    // Apply saved font size on page load
    setFontSize(getFontSize());
});

// Function to set font size and save to localStorage
function setFontSize(size) {
    document.body.style.fontSize = `${size}px`;
    localStorage.setItem('fontSize', size);
    if (document.getElementById('font-size-value')) {
        document.getElementById('font-size-value').textContent = size;
    }
    if (document.getElementById('font-size-slider')) {
        document.getElementById('font-size-slider').value = size;
    }
}

// Function to get font size from localStorage or return default
function getFontSize() {
    return localStorage.getItem('fontSize') || 16;
}

function createWindow(title, content) {
    const windowId = 'window-' + Date.now(); // Generate a unique ID
    const window = document.createElement('div');
    window.id = windowId;
    window.className = 'window';
    
    // Load saved position and size from localStorage
    const savedState = JSON.parse(localStorage.getItem(windowId) || '{}');
    window.style.left = savedState.left || '50px';
    window.style.top = savedState.top || '50px';
    window.style.width = savedState.width || '400px';
    window.style.height = savedState.height || '300px';
    
    window.style.zIndex = getTopZIndex() + 1;
    window.innerHTML = `
        <div class="window-header">
            <span class="window-title">${title}</span>
            <div class="window-controls">
                <button class="window-control minimize">-</button>
                <button class="window-control maximize">□</button>
                <button class="window-control close">×</button>
            </div>
        </div>
        <div class="window-content">
            ${content}
        </div>
        <div class="resize-handle top"></div>
        <div class="resize-handle bottom"></div>
        <div class="resize-handle left"></div>
        <div class="resize-handle right"></div>
        <div class="resize-handle top-left"></div>
        <div class="resize-handle top-right"></div>
        <div class="resize-handle bottom-left"></div>
        <div class="resize-handle bottom-right"></div>
    `;
    document.body.appendChild(window);
    windows[windowId] = window;
    addWindowFunctionality(window);
    createTaskbarButton(window);
    return window;
}

function openWindow(id) {
    if (!windows[id]) {
        const content = createWindowContent(id);
        const title = getWindowTitle(id);
        windows[id] = createWindow(title, content);
    } else {
        // If the window exists but was closed, show it again
        windows[id].classList.remove('minimized');
    }
    windows[id].classList.add('show');
    createTaskbarButton(windows[id]); // Recreate taskbar button if it doesn't exist
    updateTaskbarButtonState(windows[id]);
}

function createWindowContent(id) {
    switch (id) {
        case 'myComputer':
            return `
                <div class="my-computer-content">
                    <h2>My Computer</h2>
                    <ul>
                        <li>Local Disk (C:)</li>
                        <li>DVD Drive (D:)</li>
                        <li>Network Drive (Z:)</li>
                    </ul>
                </div>
            `;
        case 'settings-window':
            const currentSize = getFontSize();
            return `
                <label for="font-size-slider">Font Size: <span id="font-size-value">${currentSize}</span>px</label>
                <input type="range" id="font-size-slider" min="12" max="24" value="${currentSize}">
            `;
        case 'fileExplorer':
            return `
                <div class="file-explorer-content">
                    <h2>File Explorer</h2>
                    <ul>
                        <li>Documents</li>
                        <li>Pictures</li>
                        <li>Music</li>
                        <li>Videos</li>
                        <li>Downloads</li>
                    </ul>
                </div>
            `;
        default:
            return '<p>Window content not found.</p>';
    }
}

function getWindowTitle(id) {
    switch (id) {
        case 'myComputer':
            return 'My Computer';
        case 'settings-window':
            return 'Settings';
        case 'fileExplorer':
            return 'File Explorer';
        default:
            return 'Untitled Window';
    }
}

function addWindowFunctionality(window) {
    const header = window.querySelector('.window-header');
    const minimizeBtn = window.querySelector('.window-control.minimize');
    const maximizeBtn = window.querySelector('.window-control.maximize');
    const closeBtn = window.querySelector('.window-control.close');

    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        if (window.classList.contains('maximized')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = window.offsetLeft;
        startTop = window.offsetTop;
        window.style.zIndex = getTopZIndex() + 1;
    }

    function drag(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        window.style.left = `${startLeft + dx}px`;
        window.style.top = `${startTop + dy}px`;
    }

    function stopDragging() {
        isDragging = false;
        saveWindowState(window);
    }

    minimizeBtn.addEventListener('click', () => {
        window.classList.add('minimized');
        window.classList.remove('show');
        updateTaskbarButtonState(window);
    });

    maximizeBtn.addEventListener('click', () => {
        window.classList.toggle('maximized');
        if (window.classList.contains('maximized')) {
            window.dataset.restoreTop = window.style.top;
            window.dataset.restoreLeft = window.style.left;
            window.style.top = '0';
            window.style.left = '0';
        } else {
            window.style.top = window.dataset.restoreTop;
            window.style.left = window.dataset.restoreLeft;
        }
    });

    closeBtn.addEventListener('click', () => {
        closeWindow(window);
    });

    // Add font size functionality if it's the settings window
    if (window.querySelector('#font-size-slider')) {
        const fontSizeSlider = window.querySelector('#font-size-slider');
        
        fontSizeSlider.value = getFontSize(); // Set initial slider value
        
        fontSizeSlider.addEventListener('input', () => {
            setFontSize(fontSizeSlider.value);
        });
    }

    // Add resizing functionality
    const resizeHandles = window.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
    });

    function startResize(e) {
        e.preventDefault();
        window.style.zIndex = getTopZIndex() + 1;
        const direction = e.target.className.split(' ')[1];
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(window.offsetWidth, 10);
        const startHeight = parseInt(window.offsetHeight, 10);
        const startLeft = window.offsetLeft;
        const startTop = window.offsetTop;

        function resize(e) {
            if (direction.includes('right'))
                window.style.width = `${startWidth + e.clientX - startX}px`;
            if (direction.includes('bottom'))
                window.style.height = `${startHeight + e.clientY - startY}px`;
            if (direction.includes('left')) {
                const newWidth = startWidth - (e.clientX - startX);
                window.style.width = `${newWidth}px`;
                window.style.left = `${startLeft + startWidth - newWidth}px`;
            }
            if (direction.includes('top')) {
                const newHeight = startHeight - (e.clientY - startY);
                window.style.height = `${newHeight}px`;
                window.style.top = `${startTop + startHeight - newHeight}px`;
            }
        }

        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            saveWindowState(window);
        }

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }
}

function getTopZIndex() {
    return Math.max(
        ...Array.from(document.querySelectorAll('.window'))
            .map(w => parseInt(w.style.zIndex) || 0)
    );
}

function closeWindow(window) {
    window.classList.remove('show');
    window.classList.add('minimized');
    const taskbarButton = document.querySelector(`.taskbar-button[data-window="${window.id}"]`);
    if (taskbarButton) {
        taskbarButton.remove();
    }
    // Remove the window from the windows object
    const windowId = Object.keys(windows).find(key => windows[key] === window);
    if (windowId) {
        delete windows[windowId];
    }
    
    // Remove the window from localStorage when closed
    localStorage.removeItem(window.id);
}

function createTaskbarButton(window) {
    const windowTitle = window.querySelector('.window-title').textContent;
    let taskbarButton = document.querySelector(`.taskbar-button[data-window="${window.id}"]`);
    
    if (!taskbarButton) {
        taskbarButton = document.createElement('div');
        taskbarButton.className = 'taskbar-button';
        taskbarButton.setAttribute('data-window', window.id);
        taskbarButton.textContent = windowTitle;
        taskbarWindows.appendChild(taskbarButton);

        taskbarButton.addEventListener('click', () => {
            if (window.classList.contains('minimized') || !window.classList.contains('show')) {
                window.classList.remove('minimized');
                window.classList.add('show');
            } else {
                window.classList.add('minimized');
                window.classList.remove('show');
            }
            updateTaskbarButtonState(window);
        });
    }
}

function updateTaskbarButtonState(window) {
    const taskbarButton = document.querySelector(`.taskbar-button[data-window="${window.id}"]`);
    if (taskbarButton) {
        taskbarButton.classList.toggle('active', window.classList.contains('show') && !window.classList.contains('minimized'));
    }
}

function saveWindowState(window) {
    const windowId = window.id;
    const state = {
        left: window.style.left,
        top: window.style.top,
        width: window.style.width,
        height: window.style.height
    };
    localStorage.setItem(windowId, JSON.stringify(state));
}

function showShutdownScreen() {
    const shutdownScreen = document.createElement('div');
    shutdownScreen.className = 'shutdown-screen';
    shutdownScreen.innerHTML = `
        <div class="shutdown-prompt">
            <p>Are you sure you want to shut down?</p>
            <button id="confirm-shutdown">Yes</button>
            <button id="cancel-shutdown">No</button>
        </div>
    `;
    document.body.appendChild(shutdownScreen);

    document.getElementById('confirm-shutdown').addEventListener('click', () => {
        showBlackScreen();
    });

    document.getElementById('cancel-shutdown').addEventListener('click', () => {
        document.body.removeChild(shutdownScreen);
    });
}

function showBlackScreen() {
    const blackScreen = document.createElement('div');
    blackScreen.className = 'black-screen';
    blackScreen.innerHTML = '<button id="power-btn">Power On</button>';
    document.body.innerHTML = '';
    document.body.appendChild(blackScreen);

    document.getElementById('power-btn').addEventListener('click', () => {
        location.reload();
    });
}

function showRestartScreen() {
    const restartScreen = document.createElement('div');
    restartScreen.className = 'restart-screen';
    restartScreen.innerHTML = `
        <div class="restart-message">
            <p>Restarting...</p>
            <p id="restart-progress">0%</p>
        </div>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(restartScreen);

    let progress = 0;
    const interval = setInterval(() => {
        progress += 1;
        document.getElementById('restart-progress').textContent = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            location.reload();
        }
    }, 30);
}

function factoryReset() {
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    // Clear local storage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();

    // Hard reload
    window.location.reload(true);
}