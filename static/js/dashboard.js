// Dashboard specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard components
    initializeDashboard();
    
    // Setup event handlers for saved responses
    setupSavedResponsesHandlers();
    
    // Handle sidebar navigation
    setupSidebarNavigation();
});

// Initialize dashboard components and animations
function initializeDashboard() {
    // Show welcome message with animation
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.classList.add('fade-in');
    }
    
    // Initialize any charts if they exist
    initializeActivityChart();
    
    // Set up tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
}

// Set up event handlers for saved responses
function setupSavedResponsesHandlers() {
    // Handle response deletion
    document.querySelectorAll('.delete-response-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const responseId = this.getAttribute('data-id');
            const responseCard = this.closest('.response-card');
            
            if (confirm('Are you sure you want to delete this saved response?')) {
                fetch(`/delete_saved_response/${responseId}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Animate the card removal
                        responseCard.classList.add('fade-out');
                        setTimeout(() => {
                            responseCard.remove();
                            
                            // Show empty state if no responses left
                            const responseGrid = document.querySelector('.saved-responses-grid');
                            if (responseGrid && responseGrid.children.length === 0) {
                                const emptyState = document.createElement('div');
                                emptyState.className = 'empty-state text-center p-4';
                                emptyState.innerHTML = `
                                    <i class="fas fa-folder-open fa-3x mb-3 text-muted"></i>
                                    <h5>No saved responses yet</h5>
                                    <p class="text-muted">Your saved career insights will appear here</p>
                                    <a href="/career_bot" class="btn btn-primary mt-2">
                                        <i class="fas fa-robot"></i> Go to CareerBot
                                    </a>
                                `;
                                responseGrid.appendChild(emptyState);
                            }
                            
                            showNotification('Response deleted successfully!', 'success');
                        }, 300);
                    } else {
                        showNotification('Error deleting response.', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error connecting to server.', 'danger');
                });
            }
        });
    });
    
    // Handle response viewing
    document.querySelectorAll('.view-response-btn').forEach(button => {
        button.addEventListener('click', function() {
            const responseTitle = this.getAttribute('data-title');
            const responseContent = this.getAttribute('data-content');
            const responseFeature = this.getAttribute('data-feature');
            
            // Get feature name for better UX
            const featureNames = {
                "1": "Career Path Suggestions",
                "2": "Resume/CV Feedback",
                "3": "Job Market Insights",
                "4": "College/Major Advice",
                "5": "Interview Preparation Tips"
            };
            
            // Populate and show modal
            const modal = document.getElementById('viewResponseModal');
            if (modal) {
                const modalTitle = modal.querySelector('.modal-title');
                const modalFeature = modal.querySelector('.modal-feature');
                const modalContent = modal.querySelector('.modal-body .response-content');
                
                if (modalTitle) modalTitle.textContent = responseTitle;
                if (modalFeature) modalFeature.textContent = featureNames[responseFeature] || "Response";
                if (modalContent) modalContent.innerHTML = formatAIResponse(decodeURIComponent(responseContent), responseFeature);
                
                // Show the modal
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
            }
        });
    });
}

// Set up sidebar navigation
function setupSidebarNavigation() {
    // Handle active state for sidebar links
    const currentLocation = window.location.pathname;
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        }
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.dashboard-sidebar').classList.toggle('show-sidebar');
        });
    }
}

// Initialize activity chart if it exists
function initializeActivityChart() {
    const activityChart = document.getElementById('activityChart');
    if (activityChart) {
        const ctx = activityChart.getContext('2d');
        
        // Sample data structure - in a real app, this would come from the server
        const dates = [];
        const today = new Date();
        
        // Create labels for the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        
        // The actual data would come from the server in a real application
        // These are empty placeholders that would be filled with user's actual usage data
        const data = [0, 0, 0, 0, 0, 0, 0];
        
        // Create the chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Interactions',
                    data: data,
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(67, 97, 238, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: 10,
                        cornerRadius: 6
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(200, 200, 200, 0.2)'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto close after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
}

// Function to format AI responses (simplified version from main.js)
function formatAIResponse(responseText, featureId) {
    // Simple check to avoid double formatting
    if (responseText.includes('<strong>') || responseText.includes('<ul>') || responseText.includes('<ol>')) {
        return responseText;
    }
    
    // Convert numbered lists
    let formatted = responseText.replace(/(\d+\.\s*)/g, '<strong>$1</strong>');
    
    // Convert bullet points
    formatted = formatted.replace(/[-•]\s*/g, '• ');
    
    // Handle line breaks
    const paragraphs = formatted.split('\n\n');
    let formattedHtml = '';
    
    paragraphs.forEach(p => {
        if (p.trim()) {
            const lines = p.split('\n');
            formattedHtml += '<p>' + lines.join('<br>') + '</p>';
        }
    });
    
    return formattedHtml || formatted;
}
