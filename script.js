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
});

function openWindow(id) {
    if (!windows[id]) {
        if (id === 'myComputer') {
            windows[id] = createWindow(id, 'My Computer', '<!-- My Computer content -->');
        } else if (id === 'settings-window') {
            windows[id] = createWindow(id, 'Settings', createSettingsContent());
        }
        addWindowFunctionality(windows[id]);
        createTaskbarButton(windows[id]);
    }
    windows[id].classList.add('show');
    windows[id].classList.remove('minimized');
    updateTaskbarButtonState(windows[id]);
}

function createWindow(id, title, content) {
    const window = document.createElement('div');
    window.id = id;
    window.className = 'window';
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
    `;
    document.body.appendChild(window);
    return window;
}

function createSettingsContent() {
    return `
        <label for="font-size-slider">Font Size: <span id="font-size-value">16</span>px</label>
        <input type="range" id="font-size-slider" min="12" max="24" value="16">
    `;
}

function addWindowFunctionality(window) {
    const minimizeBtn = window.querySelector('.window-control.minimize');
    const maximizeBtn = window.querySelector('.window-control.maximize');
    const closeBtn = window.querySelector('.window-control.close');

    minimizeBtn.addEventListener('click', () => {
        window.classList.add('minimized');
        window.classList.remove('show');
        updateTaskbarButtonState(window);
    });

    maximizeBtn.addEventListener('click', () => {
        window.classList.toggle('maximized');
    });

    closeBtn.addEventListener('click', () => {
        window.remove();
        const taskbarButton = document.querySelector(`.taskbar-button[data-window="${window.id}"]`);
        if (taskbarButton) {
            taskbarButton.remove();
        }
        delete windows[window.id];
    });
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