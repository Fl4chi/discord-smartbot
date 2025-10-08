// Discord SmartBot Dashboard Script
// Basic JavaScript for dashboard interactions

// Dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Discord SmartBot Dashboard Loaded');
    
    // Initialize dashboard components
    initializeDashboard();
    initializePlaceholderChart();
    setupEventListeners();
});

// Main dashboard initialization
function initializeDashboard() {
    // Dashboard stats update
    updateDashboardStats();
    
    // Update timestamp
    updateLastUpdated();
}

// Update dashboard statistics
function updateDashboardStats() {
    // Placeholder data - replace with real API calls
    const stats = {
        totalMessages: 1247,
        activeUsers: 89,
        botUptime: '2d 14h 32m',
        commandsProcessed: 342
    };
    
    // Update DOM elements if they exist
    const totalMessagesEl = document.getElementById('total-messages');
    const activeUsersEl = document.getElementById('active-users');
    const botUptimeEl = document.getElementById('bot-uptime');
    const commandsProcessedEl = document.getElementById('commands-processed');
    
    if (totalMessagesEl) totalMessagesEl.textContent = stats.totalMessages;
    if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers;
    if (botUptimeEl) botUptimeEl.textContent = stats.botUptime;
    if (commandsProcessedEl) commandsProcessedEl.textContent = stats.commandsProcessed;
}

// Initialize placeholder chart
function initializePlaceholderChart() {
    const chartContainer = document.getElementById('activity-chart');
    
    if (!chartContainer) {
        console.warn('Chart container not found');
        return;
    }
    
    // Create a simple SVG chart as placeholder
    const chartHTML = `
        <svg width="400" height="200" viewBox="0 0 400 200" class="activity-chart">
            <style>
                .chart-line { fill: none; stroke: #7289da; stroke-width: 2; }
                .chart-dot { fill: #7289da; }
                .chart-grid { stroke: #e3e5e8; stroke-width: 1; }
                .chart-text { font-family: Arial, sans-serif; font-size: 10px; fill: #72767d; }
            </style>
            
            <!-- Grid lines -->
            <line class="chart-grid" x1="0" y1="50" x2="400" y2="50"/>
            <line class="chart-grid" x1="0" y1="100" x2="400" y2="100"/>
            <line class="chart-grid" x1="0" y1="150" x2="400" y2="150"/>
            
            <!-- Sample data line -->
            <polyline class="chart-line" points="0,150 50,120 100,100 150,80 200,90 250,60 300,70 350,40 400,50"/>
            
            <!-- Data points -->
            <circle class="chart-dot" cx="0" cy="150" r="3"/>
            <circle class="chart-dot" cx="50" cy="120" r="3"/>
            <circle class="chart-dot" cx="100" cy="100" r="3"/>
            <circle class="chart-dot" cx="150" cy="80" r="3"/>
            <circle class="chart-dot" cx="200" cy="90" r="3"/>
            <circle class="chart-dot" cx="250" cy="60" r="3"/>
            <circle class="chart-dot" cx="300" cy="70" r="3"/>
            <circle class="chart-dot" cx="350" cy="40" r="3"/>
            <circle class="chart-dot" cx="400" cy="50" r="3"/>
            
            <!-- Labels -->
            <text class="chart-text" x="0" y="190">00:00</text>
            <text class="chart-text" x="180" y="190">12:00</text>
            <text class="chart-text" x="380" y="190">24:00</text>
        </svg>
    `;
    
    chartContainer.innerHTML = chartHTML;
    console.log('Placeholder chart initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshDashboard();
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            toggleSettingsPanel();
        });
    }
    
    // Auto-refresh every 30 seconds
    setInterval(function() {
        updateDashboardStats();
        updateLastUpdated();
    }, 30000);
}

// Refresh dashboard data
function refreshDashboard() {
    console.log('Refreshing dashboard...');
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call delay
    setTimeout(function() {
        updateDashboardStats();
        initializePlaceholderChart();
        updateLastUpdated();
        hideLoadingState();
        
        // Show success message
        showNotification('Dashboard refreshed successfully!', 'success');
    }, 1000);
}

// Toggle settings panel
function toggleSettingsPanel() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
        settingsPanel.classList.toggle('hidden');
    }
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Show loading state
function showLoadingState() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'block';
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationEl = document.getElementById('notification');
    if (!notificationEl) {
        notificationEl = document.createElement('div');
        notificationEl.id = 'notification';
        notificationEl.className = 'notification';
        document.body.appendChild(notificationEl);
    }
    
    // Set message and type
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(function() {
        notificationEl.style.display = 'none';
    }, 3000);
}

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

// Export functions for use in other scripts
window.DashboardAPI = {
    refresh: refreshDashboard,
    updateStats: updateDashboardStats,
    showNotification: showNotification
};

console.log('Discord SmartBot Dashboard Script Loaded Successfully');
