// Wait for the DOM to be fully loaded before executing scripts
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Initialize popovers
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(popover => {
        new bootstrap.Popover(popover);
    });

    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Handle flash message dismissal
    const flashAlerts = document.querySelectorAll('.alert-dismissible');
    flashAlerts.forEach(alert => {
        const closeBtn = alert.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alert.remove();
            });
            
            // Auto close after 5 seconds
            setTimeout(() => {
                alert.classList.add('fade');
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }, 5000);
        }
    });

    // Feature card selection in CareerBot
    const featureCards = document.querySelectorAll('.feature-card');
    const featureContents = document.querySelectorAll('.feature-content');
    
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const featureId = this.getAttribute('data-feature');
            
            // Remove active class from all cards and hide all content
            featureCards.forEach(c => c.classList.remove('active'));
            featureContents.forEach(content => content.style.display = 'none');
            
            // Add active class to clicked card and show corresponding content
            this.classList.add('active');
            document.getElementById(`feature-${featureId}`).style.display = 'block';
            
            // Show chat container for this feature
            const chatContainer = document.getElementById(`chat-feature-${featureId}`);
            if (chatContainer) {
                chatContainer.style.display = 'flex';
                
                // Load chat history for this feature if user is logged in
                if (document.body.classList.contains('logged-in')) {
                    loadUserChatHistory(featureId);
                }
            }
        });
    });

    // Function to load user chat history from the server
    function loadUserChatHistory(featureId) {
        const formData = new FormData();
        formData.append('feature_id', featureId);
        
        fetch('/get_user_chat_history', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.chat_history) {
                renderChatMessages(featureId, data.chat_history);
            }
        })
        .catch(error => console.error('Error loading chat history:', error));
    }

    // Career Suggestions Feature (Feature 1)
    const interestInput = document.getElementById('interest');
    const getCareersBtn = document.getElementById('get-careers');
    const careerResults = document.getElementById('career-results');
    const suggestionsListEl = document.querySelector('.suggestions-list');
    const getAiAdviceBtn = document.getElementById('get-ai-advice');
    const aiAdviceEl = document.querySelector('.ai-advice');
    
    if (getCareersBtn) {
        getCareersBtn.addEventListener('click', function() {
            if (!interestInput || !interestInput.value.trim()) {
                showAlert('Please enter your interests first', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Getting suggestions...';
            
            const formData = new FormData();
            formData.append('interest', interestInput.value);
            
            fetch('/get_careers', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display the suggestions
                if (suggestionsListEl) {
                    suggestionsListEl.innerHTML = '';
                    
                    // Parse the comma-separated list from the API
                    const careers = data.insights.split(',').map(career => career.trim());
                    careers.forEach(career => {
                        if (career && !career.toLowerCase().includes('error')) {
                            const li = document.createElement('li');
                            li.textContent = career;
                            suggestionsListEl.appendChild(li);
                        }
                    });
                    
                    // Show results box
                    if (careerResults) {
                        careerResults.style.display = 'block';
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('1', data.chat_history);
                    }
                    
                    // Scroll to results
                    careerResults.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error fetching career suggestions:', error);
                showAlert('Error fetching career suggestions. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getCareersBtn.disabled = false;
                getCareersBtn.innerText = 'Get Suggestions';
            });
        });
    }

    // Get detailed AI advice for careers
    if (getAiAdviceBtn) {
        getAiAdviceBtn.addEventListener('click', function() {
            if (!interestInput || !interestInput.value.trim()) {
                showAlert('Please enter your interests first', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Getting AI advice...';
            
            const formData = new FormData();
            formData.append('interest', interestInput.value);
            
            fetch('/get_ai_advice', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display AI advice
                if (aiAdviceEl) {
                    // Use utility function to format the response nicely
                    const formattedAdvice = formatAIResponse(data.advice, '1');
                    aiAdviceEl.innerHTML = `<div class="ai-response">${formattedAdvice}</div>`;
                    
                    // Show save response button for logged in users
                    if (document.body.classList.contains('logged-in')) {
                        aiAdviceEl.innerHTML += `
                            <button class="btn btn-sm btn-primary mt-3 save-response-btn" 
                                    data-feature="1" 
                                    data-content="${encodeURIComponent(data.advice)}"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#saveResponseModal">
                                <i class="fas fa-save"></i> Save this response
                            </button>`;
                        
                        // Attach event listener to the newly created save button
                        attachSaveResponseListeners();
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('1', data.chat_history);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching AI advice:', error);
                showAlert('Error fetching AI advice. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getAiAdviceBtn.disabled = false;
                getAiAdviceBtn.innerText = 'Get AI Advice';
            });
        });
    }

    // Resume/CV Feedback Feature (Feature 2)
    const resumeTextarea = document.getElementById('resume');
    const resumeFileInput = document.getElementById('resume-file');
    const fileNameDisplay = document.getElementById('file-name');
    const getResumeFeedbackBtn = document.getElementById('get-resume-feedback');
    const resumeResults = document.getElementById('resume-results');
    const feedbackTextEl = document.querySelector('.feedback-text');
    
    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = fileName;
                }
                
                // Read file content for txt files
                if (fileName.toLowerCase().endsWith('.txt')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (resumeTextarea) {
                            resumeTextarea.value = e.target.result;
                        }
                    };
                    reader.readAsText(this.files[0]);
                } else {
                    // For other file types, suggest copy-pasting
                    showAlert('For best results with non-text files, please copy and paste the content directly.', 'info');
                }
            }
        });
    }
    
    if (getResumeFeedbackBtn) {
        getResumeFeedbackBtn.addEventListener('click', function() {
            const resumeFile = resumeFileInput && resumeFileInput.files && resumeFileInput.files[0];
            const resumeText = resumeTextarea ? resumeTextarea.value.trim() : '';
            
            if (!resumeText && !resumeFile) {
                showAlert('Please enter your resume text or upload a file', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Analyzing resume...';
            
            const formData = new FormData();
            
            // If we have textarea content, use that
            if (resumeText) {
                formData.append('resume_text', resumeText);
            }
            
            // If we have a file, append it to the form data
            if (resumeFile) {
                formData.append('resume_file', resumeFile);
            }
            
            fetch('/get_resume_feedback', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display feedback
                if (feedbackTextEl) {
                    // Format the feedback response
                    const formattedFeedback = formatAIResponse(data.feedback, '2');
                    feedbackTextEl.innerHTML = formattedFeedback;
                    
                    // Show results
                    if (resumeResults) {
                        resumeResults.style.display = 'block';
                    }
                    
                    // Add save button for logged in users
                    if (document.body.classList.contains('logged-in')) {
                        feedbackTextEl.innerHTML += `
                            <button class="btn btn-sm btn-primary mt-3 save-response-btn" 
                                    data-feature="2" 
                                    data-content="${encodeURIComponent(data.feedback)}"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#saveResponseModal">
                                <i class="fas fa-save"></i> Save this feedback
                            </button>`;
                        
                        // Attach event listener to the newly created save button
                        attachSaveResponseListeners();
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('2', data.chat_history);
                    }
                    
                    // Scroll to results
                    resumeResults.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error fetching resume feedback:', error);
                showAlert('Error analyzing resume. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getResumeFeedbackBtn.disabled = false;
                getResumeFeedbackBtn.innerText = 'Get Feedback';
            });
        });
    }

    // Job Market Insights Feature (Feature 3)
    const marketTopicInput = document.getElementById('market-topic');
    const getMarketInsightsBtn = document.getElementById('get-market-insights');
    const marketResults = document.getElementById('market-results');
    const insightsTextEl = document.querySelector('.insights-text');
    
    if (getMarketInsightsBtn) {
        getMarketInsightsBtn.addEventListener('click', function() {
            if (!marketTopicInput || !marketTopicInput.value.trim()) {
                showAlert('Please enter a job market topic first', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Getting insights...';
            
            const formData = new FormData();
            formData.append('topic', marketTopicInput.value);
            
            fetch('/get_market_insights', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display insights
                if (insightsTextEl) {
                    // Format the insights response
                    const formattedInsights = formatAIResponse(data.insights, '3');
                    insightsTextEl.innerHTML = formattedInsights;
                    
                    // Show results
                    if (marketResults) {
                        marketResults.style.display = 'block';
                    }
                    
                    // Add save button for logged in users
                    if (document.body.classList.contains('logged-in')) {
                        insightsTextEl.innerHTML += `
                            <button class="btn btn-sm btn-primary mt-3 save-response-btn" 
                                    data-feature="3" 
                                    data-content="${encodeURIComponent(data.insights)}"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#saveResponseModal">
                                <i class="fas fa-save"></i> Save these insights
                            </button>`;
                        
                        attachSaveResponseListeners();
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('3', data.chat_history);
                    }
                    
                    // Scroll to results
                    marketResults.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error fetching market insights:', error);
                showAlert('Error getting market insights. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getMarketInsightsBtn.disabled = false;
                getMarketInsightsBtn.innerText = 'Get Insights';
            });
        });
    }

    // College/Major Advice Feature (Feature 4)
    const majorInput = document.getElementById('major');
    const getCollegeAdviceBtn = document.getElementById('get-college-advice');
    const collegeResults = document.getElementById('college-results');
    const collegeAdviceTextEl = document.querySelector('.college-advice-text');
    
    if (getCollegeAdviceBtn) {
        getCollegeAdviceBtn.addEventListener('click', function() {
            if (!majorInput || !majorInput.value.trim()) {
                showAlert('Please enter a major first', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Getting advice...';
            
            const formData = new FormData();
            formData.append('major', majorInput.value);
            
            fetch('/get_college_advice', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display college advice
                if (collegeAdviceTextEl) {
                    // Format the advice response
                    const formattedAdvice = formatAIResponse(data.advice, '4');
                    collegeAdviceTextEl.innerHTML = formattedAdvice;
                    
                    // Show results
                    if (collegeResults) {
                        collegeResults.style.display = 'block';
                    }
                    
                    // Add save button for logged in users
                    if (document.body.classList.contains('logged-in')) {
                        collegeAdviceTextEl.innerHTML += `
                            <button class="btn btn-sm btn-primary mt-3 save-response-btn" 
                                    data-feature="4" 
                                    data-content="${encodeURIComponent(data.advice)}"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#saveResponseModal">
                                <i class="fas fa-save"></i> Save this advice
                            </button>`;
                        
                        attachSaveResponseListeners();
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('4', data.chat_history);
                    }
                    
                    // Scroll to results
                    collegeResults.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error fetching college advice:', error);
                showAlert('Error getting college advice. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getCollegeAdviceBtn.disabled = false;
                getCollegeAdviceBtn.innerText = 'Get Advice';
            });
        });
    }

    // Interview Preparation Tips Feature (Feature 5)
    const roleInput = document.getElementById('role');
    const getInterviewTipsBtn = document.getElementById('get-interview-tips');
    const interviewResults = document.getElementById('interview-results');
    const interviewTipsTextEl = document.querySelector('.interview-tips-text');
    
    if (getInterviewTipsBtn) {
        getInterviewTipsBtn.addEventListener('click', function() {
            if (!roleInput || !roleInput.value.trim()) {
                showAlert('Please enter a role first', 'warning');
                return;
            }
            
            // Disable button and show loading state
            this.disabled = true;
            this.innerText = 'Getting tips...';
            
            const formData = new FormData();
            formData.append('role', roleInput.value);
            
            fetch('/get_interview_tips', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Display interview tips
                if (interviewTipsTextEl) {
                    // Format the tips response
                    const formattedTips = formatAIResponse(data.tips, '5');
                    interviewTipsTextEl.innerHTML = formattedTips;
                    
                    // Show results
                    if (interviewResults) {
                        interviewResults.style.display = 'block';
                    }
                    
                    // Add save button for logged in users
                    if (document.body.classList.contains('logged-in')) {
                        interviewTipsTextEl.innerHTML += `
                            <button class="btn btn-sm btn-primary mt-3 save-response-btn" 
                                    data-feature="5" 
                                    data-content="${encodeURIComponent(data.tips)}"
                                    data-bs-toggle="modal" 
                                    data-bs-target="#saveResponseModal">
                                <i class="fas fa-save"></i> Save these tips
                            </button>`;
                        
                        attachSaveResponseListeners();
                    }
                    
                    // Render chat history if available
                    if (data.chat_history && data.chat_history.length > 0) {
                        renderChatMessages('5', data.chat_history);
                    }
                    
                    // Scroll to results
                    interviewResults.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error('Error fetching interview tips:', error);
                showAlert('Error getting interview tips. Please try again.', 'danger');
            })
            .finally(() => {
                // Re-enable button
                getInterviewTipsBtn.disabled = false;
                getInterviewTipsBtn.innerText = 'Get Tips';
            });
        });
    }

    // Set up chat functionality for all features
    for (let i = 1; i <= 5; i++) {
        const chatInput = document.getElementById(`chat-input-${i}`);
        const chatSendBtn = document.getElementById(`chat-send-${i}`);
        const clearChatBtn = document.querySelector(`.clear-chat[data-feature="${i}"]`);
        
        if (chatInput && chatSendBtn) {
            // Send message on button click
            chatSendBtn.addEventListener('click', function() {
                sendChatMessage(i);
            });
            
            // Send message on Enter key
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendChatMessage(i);
                }
            });
            
            // Clear chat history
            if (clearChatBtn) {
                clearChatBtn.addEventListener('click', function() {
                    const featureId = this.getAttribute('data-feature');
                    clearChat(featureId);
                });
            }
        }
    }

    // Function to send chat message
    function sendChatMessage(featureId) {
        const chatInput = document.getElementById(`chat-input-${featureId}`);
        const chatMessages = document.getElementById(`chat-messages-${featureId}`);
        
        if (!chatInput || !chatInput.value.trim()) return;
        
        const userMessage = chatInput.value.trim();
        chatInput.value = '';
        
        // Add user message to chat
        const userMessageEl = document.createElement('div');
        userMessageEl.className = 'chat-message user-message';
        userMessageEl.textContent = userMessage;
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timestampEl = document.createElement('span');
        timestampEl.className = 'message-timestamp';
        timestampEl.textContent = timestamp;
        userMessageEl.appendChild(timestampEl);
        
        chatMessages.appendChild(userMessageEl);
        
        // Add loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message-loading';
        loadingEl.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(loadingEl);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send to server
        const formData = new FormData();
        formData.append('feature_id', featureId);
        formData.append('message', userMessage);
        
        fetch('/chat', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            chatMessages.removeChild(loadingEl);
            
            // Render all chat messages (including new ones)
            renderChatMessages(featureId, data.chat_history);
        })
        .catch(error => {
            console.error('Error sending chat message:', error);
            
            // Remove loading indicator
            chatMessages.removeChild(loadingEl);
            
            // Add error message
            const errorMessageEl = document.createElement('div');
            errorMessageEl.className = 'chat-message assistant-message';
            errorMessageEl.innerHTML = 'Sorry, there was an error processing your message. Please try again.';
            chatMessages.appendChild(errorMessageEl);
            
            // Scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // Function to render chat messages
    function renderChatMessages(featureId, chatHistory) {
        const chatMessagesEl = document.getElementById(`chat-messages-${featureId}`);
        if (!chatMessagesEl || !chatHistory) return;
        
        chatMessagesEl.innerHTML = '';
        
        chatHistory.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`;
            
            // Format assistant responses
            if (message.role === 'assistant') {
                messageEl.innerHTML = formatAIResponse(message.content, featureId);
            } else {
                messageEl.textContent = message.content;
            }
            
            // Add timestamp
            const timestampEl = document.createElement('span');
            timestampEl.className = 'message-timestamp';
            timestampEl.textContent = message.timestamp;
            messageEl.appendChild(timestampEl);
            
            chatMessagesEl.appendChild(messageEl);
        });
        
        // Scroll to the bottom
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }

    // Function to format AI responses based on feature type
    function formatAIResponse(responseText, featureId) {
        // Simple check to avoid double formatting
        if (responseText.includes('<strong>') || responseText.includes('<ul>') || responseText.includes('<ol>')) {
            return responseText;
        }
        
        // Format based on feature type
        switch(featureId) {
            case '1': // Career path suggestions
                return formatCareerPathResponse(responseText);
            case '2': // Resume/CV feedback
                return formatResumeFeedbackResponse(responseText);
            case '3': // Job market insights
                return formatMarketInsightsResponse(responseText);
            case '4': // College/major advice
                return formatCollegeAdviceResponse(responseText);
            case '5': // Interview preparation tips
                return formatInterviewTipsResponse(responseText);
            default:
                return formatGenericResponse(responseText);
        }
    }

    // Format Career Path Suggestions (Feature 1)
    function formatCareerPathResponse(text) {
        // Handle simple chat responses without structure
        if (!text.includes('Top 5 Recommended Careers') && 
            !text.includes('Key Skills Needed') &&
            !text.includes('Education Requirements')) {
            return formatGenericResponse(text);
        }
        
        // Create HTML structure
        let formattedHtml = '<div class="response-section">';
        
        // Process Top 5 Recommended Careers section
        if (text.includes('Top 5 Recommended Careers:')) {
            let careersSection = text.split('Top 5 Recommended Careers:')[1];
            if (careersSection.includes('Key Skills Needed:')) {
                careersSection = careersSection.split('Key Skills Needed:')[0];
            }
            
            formattedHtml += '<h4>Top 5 Recommended Careers:</h4>';
            formattedHtml += '<ul>';
            
            // Split career items
            let careers = careersSection.split(/[\n-]/).filter(item => item.trim().length > 0);
            careers.forEach(career => {
                formattedHtml += `<li>${career.trim()}</li>`;
            });
            
            formattedHtml += '</ul>';
        }
        
        // Process Key Skills Needed section
        if (text.includes('Key Skills Needed:')) {
            let skillsSection = text.split('Key Skills Needed:')[1];
            if (skillsSection.includes('Education Requirements:')) {
                skillsSection = skillsSection.split('Education Requirements:')[0];
            } else if (skillsSection.includes('Quick Starting Tips:')) {
                skillsSection = skillsSection.split('Quick Starting Tips:')[0];
            }
            
            formattedHtml += '<h4>Key Skills Needed:</h4>';
            formattedHtml += '<ul>';
            
            // Split skill items
            let skills = skillsSection.split(/[\n-]/).filter(item => item.trim().length > 0);
            skills.forEach(skill => {
                formattedHtml += `<li>${skill.trim()}</li>`;
            });
            
            formattedHtml += '</ul>';
        }
        
        // Process Education Requirements section
        if (text.includes('Education Requirements:')) {
            let eduSection = text.split('Education Requirements:')[1];
            if (eduSection.includes('Quick Starting Tips:')) {
                eduSection = eduSection.split('Quick Starting Tips:')[0];
            }
            
            formattedHtml += '<h4>Education Requirements:</h4>';
            formattedHtml += `<p>${eduSection.trim()}</p>`;
        }
        
        // Process Quick Starting Tips section
        if (text.includes('Quick Starting Tips:')) {
            let tipsSection = text.split('Quick Starting Tips:')[1];
            
            formattedHtml += '<h4>Quick Starting Tips:</h4>';
            formattedHtml += '<ul>';
            
            // Split tip items
            let tips = tipsSection.split(/[\n-]/).filter(item => item.trim().length > 0);
            tips.forEach(tip => {
                formattedHtml += `<li>${tip.trim()}</li>`;
            });
            
            formattedHtml += '</ul>';
        }
        
        formattedHtml += '</div>';
        return formattedHtml;
    }

    // Format Resume Feedback (Feature 2)
    function formatResumeFeedbackResponse(text) {
        // Handle simple chat responses without structure
        if (!text.includes('Strengths') && 
            !text.includes('Areas to Improve') &&
            !text.includes('ATS Score')) {
            return formatGenericResponse(text);
        }
        
        let formattedHtml = '<div class="response-section">';
        
        // Process Strengths section
        if (text.includes('Strengths')) {
            let strengthsSection = text.split(/Strengths/i)[1];
            if (strengthsSection.includes('Areas to Improve')) {
                strengthsSection = strengthsSection.split(/Areas to Improve/i)[0];
            }
            
            formattedHtml += '<div class="feedback-item positive">';
            formattedHtml += '<h4>💪 Strengths</h4>';
            formattedHtml += '<ul>';
            
            // Split strength items
            let strengths = strengthsSection.split(/[\n\d\.\)-]/).filter(item => item.trim().length > 0);
            strengths.forEach(strength => {
                formattedHtml += `<li>${strength.trim()}</li>`;
            });
            
            formattedHtml += '</ul></div>';
        }
        
        // Process Areas to Improve section
        if (text.includes('Areas to Improve')) {
            let improvementsSection = text.split(/Areas to Improve/i)[1];
            if (improvementsSection.includes('ATS Score')) {
                improvementsSection = improvementsSection.split(/ATS Score/i)[0];
            }
            
            formattedHtml += '<div class="feedback-item negative">';
            formattedHtml += '<h4>🔍 Areas to Improve</h4>';
            formattedHtml += '<ul>';
            
            // Split improvement items
            let improvements = improvementsSection.split(/[\n\d\.\)-]/).filter(item => item.trim().length > 0);
            improvements.forEach(improvement => {
                formattedHtml += `<li>${improvement.trim()}</li>`;
            });
            
            formattedHtml += '</ul></div>';
        }
        
        // Process ATS Score section
        if (text.includes('ATS Score')) {
            let scoreSection = text.split(/ATS Score/i)[1];
            let score = scoreSection.match(/\d+\/10/) ? scoreSection.match(/\d+\/10/)[0] : '';
            
            if (score) {
                formattedHtml += '<div class="feedback-item">';
                formattedHtml += '<h4>🤖 ATS Score</h4>';
                formattedHtml += `<p class="text-center"><span class="fs-3 fw-bold">${score}</span></p>`;
                formattedHtml += '</div>';
            }
        }
        
        // Process Recommendation section
        if (text.toLowerCase().includes('recommendation')) {
            let recSection = '';
            if (text.includes('final recommendation')) {
                recSection = text.split(/final recommendation/i)[1];
            } else if (text.includes('recommendation')) {
                recSection = text.split(/recommendation/i)[1];
            }
            
            if (recSection) {
                formattedHtml += '<div class="feedback-item recommendation">';
                formattedHtml += '<h4>💡 Recommendation</h4>';
                formattedHtml += `<p>${recSection.trim()}</p>`;
                formattedHtml += '</div>';
            }
        }
        
        formattedHtml += '</div>';
        return formattedHtml;
    }

    // Format Job Market Insights (Feature 3)
    function formatMarketInsightsResponse(text) {
        // Handle simple chat responses without structure
        if (!text.includes('Current Demand') && 
            !text.includes('Salary Range') &&
            !text.includes('Growth Outlook')) {
            return formatGenericResponse(text);
        }
        
        let formattedHtml = '<div class="response-section">';
        
        // Create a mapping of sections to icons and classes
        const sections = [
            { key: 'Current Demand', icon: '📊', class: '' },
            { key: 'Salary Range', icon: '💰', class: '' },
            { key: 'Growth Outlook', icon: '📈', class: '' },
            { key: 'Key Skills', icon: '🔑', class: '' },
            { key: 'Quick Tip', icon: '💡', class: 'recommendation' }
        ];
        
        // Process each section
        sections.forEach(section => {
            if (text.includes(section.key)) {
                let sectionContent = text.split(section.key + ':')[1];
                // Find the end of this section by looking for the next section
                for (const nextSection of sections) {
                    if (nextSection.key !== section.key && sectionContent.includes(nextSection.key + ':')) {
                        sectionContent = sectionContent.split(nextSection.key + ':')[0];
                        break;
                    }
                }
                
                formattedHtml += `<div class="feedback-item ${section.class}">`;
                formattedHtml += `<h4>${section.icon} ${section.key}</h4>`;
                
                // Special formatting for Key Skills section
                if (section.key === 'Key Skills') {
                    formattedHtml += '<ul>';
                    let skills = sectionContent.split(/[\n-]/).filter(item => item.trim().length > 0);
                    skills.forEach(skill => {
                        formattedHtml += `<li>${skill.trim()}</li>`;
                    });
                    formattedHtml += '</ul>';
                } else {
                    formattedHtml += `<p>${sectionContent.trim()}</p>`;
                }
                
                formattedHtml += '</div>';
            }
        });
        
        formattedHtml += '</div>';
        return formattedHtml;
    }

    // Format College/Major Advice (Feature 4)
    function formatCollegeAdviceResponse(text) {
        // Handle simple chat responses without structure
        if (!text.includes('Top 3 Career Paths') && 
            !text.includes('Required Skills') &&
            !text.includes('Entry Requirements')) {
            return formatGenericResponse(text);
        }
        
        let formattedHtml = '<div class="response-section">';
        
        // Create a mapping of sections to icons and classes
        const sections = [
            { key: 'Top 3 Career Paths', icon: '🚀', class: '' },
            { key: 'Required Skills', icon: '🧠', class: '' },
            { key: 'Entry Requirements', icon: '🎯', class: '' },
            { key: 'Quick Advice', icon: '💡', class: 'recommendation' }
        ];
        
        // Process each section
        sections.forEach(section => {
            if (text.includes(section.key)) {
                let sectionContent = text.split(section.key + ':')[1];
                // Find the end of this section by looking for the next section
                for (const nextSection of sections) {
                    if (nextSection.key !== section.key && sectionContent.includes(nextSection.key + ':')) {
                        sectionContent = sectionContent.split(nextSection.key + ':')[0];
                        break;
                    }
                }
                
                formattedHtml += `<div class="feedback-item ${section.class}">`;
                formattedHtml += `<h4>${section.icon} ${section.key}</h4>`;
                
                // Special formatting for Top 3 Career Paths and Required Skills sections
                if (section.key === 'Top 3 Career Paths' || section.key === 'Required Skills') {
                    formattedHtml += '<ul>';
                    let items = sectionContent.split(/[\n-]/).filter(item => item.trim().length > 0);
                    items.forEach(item => {
                        formattedHtml += `<li>${item.trim()}</li>`;
                    });
                    formattedHtml += '</ul>';
                } else {
                    formattedHtml += `<p>${sectionContent.trim()}</p>`;
                }
                
                formattedHtml += '</div>';
            }
        });
        
        formattedHtml += '</div>';
        return formattedHtml;
    }

    // Format Interview Preparation Tips (Feature 5)
    function formatInterviewTipsResponse(text) {
        // Handle simple chat responses without structure
        if (!text.includes('Key Skills to Highlight') && 
            !text.includes('Common Questions') &&
            !text.includes('Preparation Strategy')) {
            return formatGenericResponse(text);
        }
        
        let formattedHtml = '<div class="response-section">';
        
        // Create a mapping of sections to icons and classes
        const sections = [
            { key: 'Key Skills to Highlight', icon: '✨', class: '' },
            { key: 'Common Questions', icon: '❓', class: '' },
            { key: 'Preparation Strategy', icon: '📝', class: '' },
            { key: 'Quick Tip', icon: '💡', class: 'recommendation' }
        ];
        
        // Process each section
        sections.forEach(section => {
            if (text.includes(section.key)) {
                let sectionContent = text.split(section.key + ':')[1];
                // Find the end of this section by looking for the next section
                for (const nextSection of sections) {
                    if (nextSection.key !== section.key && sectionContent.includes(nextSection.key + ':')) {
                        sectionContent = sectionContent.split(nextSection.key + ':')[0];
                        break;
                    }
                }
                
                formattedHtml += `<div class="feedback-item ${section.class}">`;
                formattedHtml += `<h4>${section.icon} ${section.key}</h4>`;
                
                // Special formatting for Key Skills and Common Questions sections
                if (section.key === 'Key Skills to Highlight' || section.key === 'Common Questions') {
                    formattedHtml += '<ul>';
                    let items = sectionContent.split(/[\n-]/).filter(item => item.trim().length > 0);
                    items.forEach(item => {
                        formattedHtml += `<li>${item.trim()}</li>`;
                    });
                    formattedHtml += '</ul>';
                } else {
                    formattedHtml += `<p>${sectionContent.trim()}</p>`;
                }
                
                formattedHtml += '</div>';
            }
        });
        
        formattedHtml += '</div>';
        return formattedHtml;
    }

    // Format generic response with basic styling
    function formatGenericResponse(text) {
        // Convert numbered lists
        text = text.replace(/(\d+\.\s*)/g, '<strong>$1</strong>');
        
        // Convert bullet points
        text = text.replace(/[-•]\s*/g, '• ');
        
        // Handle line breaks
        const paragraphs = text.split('\n\n');
        let formatted = '';
        
        paragraphs.forEach(p => {
            if (p.trim()) {
                const lines = p.split('\n');
                formatted += '<p>' + lines.join('<br>') + '</p>';
            }
        });
        
        return formatted || text;
    }

    // Function to clear chat
    function clearChat(featureId) {
        const formData = new FormData();
        formData.append('feature_id', featureId);
        
        fetch('/clear_chat', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const chatMessagesEl = document.getElementById(`chat-messages-${featureId}`);
                if (chatMessagesEl) {
                    chatMessagesEl.innerHTML = '';
                }
                showAlert('Chat history cleared!', 'success');
            }
        })
        .catch(error => {
            console.error('Error clearing chat:', error);
            showAlert('Error clearing chat history.', 'danger');
        });
    }

    // Function to show alert message
    function showAlert(message, type = 'info') {
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

    // Save response functionality
    function attachSaveResponseListeners() {
        const saveButtons = document.querySelectorAll('.save-response-btn');
        
        saveButtons.forEach(button => {
            button.addEventListener('click', function() {
                const featureId = this.getAttribute('data-feature');
                const content = decodeURIComponent(this.getAttribute('data-content'));
                
                // Set values in the modal
                const modal = document.getElementById('saveResponseModal');
                if (modal) {
                    const featureInput = modal.querySelector('#response-feature-id');
                    const contentInput = modal.querySelector('#response-content');
                    const titleInput = modal.querySelector('#response-title');
                    
                    if (featureInput) featureInput.value = featureId;
                    if (contentInput) contentInput.value = content;
                    
                    // Generate default title based on feature
                    if (titleInput) {
                        const featureNames = {
                            "1": "Career Path Advice",
                            "2": "Resume Feedback",
                            "3": "Job Market Insights",
                            "4": "College/Major Advice",
                            "5": "Interview Tips"
                        };
                        
                        const defaultTitle = `${featureNames[featureId] || 'Response'} - ${new Date().toLocaleDateString()}`;
                        titleInput.value = defaultTitle;
                    }
                }
            });
        });
        
        // Handle save response form submission
        const saveResponseForm = document.getElementById('save-response-form');
        if (saveResponseForm) {
            saveResponseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const featureId = document.getElementById('response-feature-id').value;
                const title = document.getElementById('response-title').value;
                const content = document.getElementById('response-content').value;
                
                if (!title.trim()) {
                    showAlert('Please enter a title for this response', 'warning');
                    return;
                }
                
                const formData = new FormData();
                formData.append('feature_id', featureId);
                formData.append('title', title);
                formData.append('response', content);
                
                fetch('/save_response', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        showAlert('Response saved successfully!', 'success');
                        
                        // Close the modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('saveResponseModal'));
                        if (modal) modal.hide();
                    }
                })
                .catch(error => {
                    console.error('Error saving response:', error);
                    showAlert('Error saving response.', 'danger');
                });
            });
        }
    }

    // Delete saved response
    document.querySelectorAll('.delete-response-btn').forEach(button => {
        button.addEventListener('click', function() {
            const responseId = this.getAttribute('data-id');
            const cardElement = this.closest('.response-card');
            
            if (confirm('Are you sure you want to delete this saved response?')) {
                fetch(`/delete_saved_response/${responseId}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        showAlert('Response deleted successfully!', 'success');
                        if (cardElement) cardElement.remove();
                    }
                })
                .catch(error => {
                    console.error('Error deleting response:', error);
                    showAlert('Error deleting response.', 'danger');
                });
            }
        });
    });
});
