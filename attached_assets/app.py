import os
from flask import Flask, render_template, request, jsonify, session
from groq import Groq
from datetime import datetime

app = Flask(__name__)
app.secret_key = "careerbot_secret_key"  # For session management

# Use your provided Groq API key
os.environ["GROQ_API_KEY"] = "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"
client = Groq(api_key=os.environ["GROQ_API_KEY"])

# Define different user intents
features = {
    "1": "Career path suggestions (based on interests, skills)",
    "2": "Resume/CV feedback",
    "3": "Job market insights",
    "4": "College/major advice",
    "5": "Interview preparation tips"
}

# Simple acknowledgments and greetings
SIMPLE_RESPONSES = {
    "ok": "Is there anything specific you'd like to know more about?",
    "okay": "Is there anything specific you'd like to know more about?",
    "thanks": "You're welcome! Anything else you'd like to know?",
    "thank you": "You're welcome! Anything else you'd like to know?",
    "great": "Glad to help! Do you have any other questions?",
    "good": "Great! Do you need any more information?",
    "hi": "Hello! How can I help with your career questions today?",
    "hello": "Hi there! How can I assist you with your career today?",
    "yes": "What would you like to know more about specifically?",
    "no": "Alright. Is there anything else I can help you with instead?",
    "sure": "Great! What would you like to know more about?",
    "got it": "Excellent! What else would you like to explore?",
    "bye": "Take care! Feel free to return if you have more questions.",
    "goodbye": "Goodbye! Wishing you success in your career endeavors!"
}

# Initialize or get chat history from session
def get_chat_history(feature_id):
    if 'chat_history' not in session:
        session['chat_history'] = {}
    
    if feature_id not in session['chat_history']:
        session['chat_history'][feature_id] = []
    
    return session['chat_history'][feature_id]

# Update chat history
def update_chat_history(feature_id, role, content):
    history = get_chat_history(feature_id)
    timestamp = datetime.now().strftime("%H:%M")
    history.append({
        "role": role,
        "content": content,
        "timestamp": timestamp
    })
    session['chat_history'][feature_id] = history
    session.modified = True
    return history

# Check if message is a simple acknowledgment
def is_simple_acknowledgment(message):
    # Clean the message and check against simple responses
    cleaned_msg = message.strip().lower()
    return cleaned_msg in SIMPLE_RESPONSES or len(cleaned_msg) <= 3

# Get appropriate response for simple acknowledgments
def get_simple_response(message):
    cleaned_msg = message.strip().lower()
    
    # If it's in our predefined responses, use that
    if cleaned_msg in SIMPLE_RESPONSES:
        return SIMPLE_RESPONSES[cleaned_msg]
    
    # For very short messages not in our dictionary
    if len(cleaned_msg) <= 3:
        return "I'm here to help with career advice. What would you like to know more about?"
    
    # Fallback for anything else
    return None

# Query Groq for simple career suggestions (just names)
def get_simple_career_suggestions(interest):
    prompt = f"List only 3-4 career titles that match the interest in '{interest}'. No descriptions, just the names separated by commas."
    
    try:
        chat_completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You provide only career title names without descriptions or explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

# Get structured prompts for each feature
def get_structured_prompt(feature_id, user_input):
    prompts = {
        "1": f"""Provide career advice for someone interested in '{user_input}'. Format your response as follows:
- Top 5 Recommended Careers: List 5 careers with one sentence description for each
- Key Skills Needed: List 4-5 essential skills for these careers
- Education Requirements: Brief overview (1-2 sentences)
- Quick Starting Tips: 2-3 practical steps to get started

Keep entire response under 250 words and be specific.""",
        
        "2": f"""Analyze this resume concisely:
{user_input}

Provide feedback in EXACTLY this format:
1. Strengths (3 bullet points, one sentence each)
2. Areas to Improve (3 bullet points, one sentence each)
3. ATS Score: X/10
4. One sentence final recommendation

Keep the entire response under 250 words and be specific.""",
        
        "3": f"""Provide current job market insights about '{user_input}' in this exact format:
1. Current Demand: Brief 1-sentence overview
2. Salary Range: Specific numbers with brief context
3. Growth Outlook: Short 1-sentence prediction
4. Key Skills: List only 3-4 most important skills
5. Quick Tip: One practical piece of advice

Keep entire response under 150 words.""",
        
        "4": f"""For the major '{user_input}', provide career guidance in this exact format:
1. Top 3 Career Paths: Just list names with one-line descriptions
2. Required Skills: Only list 3-4 most essential skills
3. Entry Requirements: Brief 1-sentence overview
4. Quick Advice: One practical tip for students

Keep the entire response under 150 words.""",
        
        "5": f"""Provide interview preparation tips for '{user_input}' role in this exact format:
1. Key Skills to Highlight: List only 3-4 critical skills
2. Common Questions: List 3 specific questions
3. Preparation Strategy: One specific action item
4. Quick Tip: One sentence of practical advice

Keep entire response under 150 words and be specific to the role."""
    }
    
    return prompts[feature_id]

# Query Groq for natural conversation in chat
def chat_conversation(user_message, feature_id, history=None):
    # Check if this is a simple acknowledgment
    simple_response = get_simple_response(user_message)
    if simple_response:
        return simple_response
    
    # Get feature context for the system message
    feature_contexts = {
        "1": "career paths and suggestions",
        "2": "resume and CV feedback",
        "3": "job market insights and trends",
        "4": "college majors and education paths",
        "5": "interview preparation and techniques"
    }
    
    feature_context = feature_contexts.get(feature_id, "careers and professional development")
    
    # Create a system message that encourages natural conversation
    system_message = f"""You are a helpful, friendly career advisor chatbot. You specialize in {feature_context}.
Respond naturally to the user's questions and comments about career advice.
Keep your responses conversational, helpful, and concise (under 150 words).
Avoid using structured formats unless specifically asked for structured information."""
    
    # Build messages including history
    messages = [{"role": "system", "content": system_message}]
    
    if history:
        # Include more history for chat to maintain context
        recent_history = history[-10:] if len(history) > 10 else history
        for msg in recent_history:
            if msg["role"] in ["user", "assistant"]:
                messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add the user message directly (no special formatting)
    messages.append({"role": "user", "content": user_message})
    
    try:
        chat_completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            max_tokens=250,
            temperature=0.8  # Slightly higher temperature for more natural conversation
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

# Query Groq (LLaMA 3) for structured advice (only for feature buttons)
def ask_groq(user_prompt, feature_id, history=None):
    # Define clear system messages for each feature type
    system_messages = {
        "1": "You are a career advisor that provides structured career advice. Always follow the exact format requested.",
        "2": "You are a resume reviewer providing structured, concise feedback. Always follow the exact format requested.",
        "3": "You are a job market analyst providing structured insights. Always follow the exact format requested.",
        "4": "You are a college advisor giving structured guidance on majors and careers. Always follow the exact format requested.",
        "5": "You are an interview coach providing structured preparation tips. Always follow the exact format requested."
    }
    
    # Select appropriate system message
    if feature_id in system_messages:
        system_message = system_messages[feature_id]
    else:
        system_message = "You are a helpful AI career advisor chatbot that provides brief, structured responses."
    
    # Get the structured prompt for this feature
    structured_prompt = get_structured_prompt(feature_id, user_prompt)
    
    # Build messages including history
    messages = [{"role": "system", "content": system_message}]
    
    if history:
        # Only include the last 3 exchanges to keep context manageable
        recent_history = history[-6:] if len(history) > 6 else history
        for msg in recent_history:
            if msg["role"] in ["user", "assistant"]:
                messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add the structured prompt
    messages.append({"role": "user", "content": structured_prompt})
    
    try:
        # Add a max_tokens parameter to further control response length
        max_tokens_map = {
            "1": 350,  # Career suggestions
            "2": 400,  # Resume feedback
            "3": 250,  # Market insights
            "4": 250,  # College advice
            "5": 250   # Interview tips
        }
        
        max_tokens = max_tokens_map.get(feature_id, 250)
        
        chat_completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7  # Lower temperature for more consistent outputs
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html', features=features)

@app.route('/get_careers', methods=['POST'])
def get_careers():
    interest = request.form['interest']
    feature_id = "1"
    
    # Get just simple career names (3-4 suggestions)
    insights = get_simple_career_suggestions(interest)
    
    return jsonify({
        'insights': insights,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/chat', methods=['POST'])
def chat():
    feature_id = request.form['feature_id']
    user_message = request.form['message']
    
    # Update chat history with user message
    update_chat_history(feature_id, "user", user_message)
    history = get_chat_history(feature_id)
    
    # Use the conversational chat function instead of the structured response function
    ai_response = chat_conversation(user_message, feature_id, history=history)
    
    # Update chat history with AI response
    update_chat_history(feature_id, "assistant", ai_response)
    
    return jsonify({
        'response': ai_response,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/clear_chat', methods=['POST'])
def clear_chat():
    feature_id = request.form['feature_id']
    if 'chat_history' in session and feature_id in session['chat_history']:
        session['chat_history'][feature_id] = []
        session.modified = True
    return jsonify({'status': 'success'})

@app.route('/get_ai_advice', methods=['POST'])
def get_ai_advice():
    interest = request.form['interest']
    feature_id = "1"  # Career paths feature
    
    # Get detailed structured AI advice (5 career suggestions with details)
    ai_advice = ask_groq(interest, feature_id)
    
    return jsonify({
        'advice': ai_advice,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/get_resume_feedback', methods=['POST'])
def get_resume_feedback():
    resume_text = ""
    feature_id = "2"  # Resume feature
    
    # Check if there's a file uploaded
    if 'resume_file' in request.files:
        file = request.files['resume_file']
        # Only process if there's an actual file (not empty)
        if file and file.filename != '':
            try:
                if file.filename.endswith('.txt'):
                    resume_text = file.read().decode('utf-8')
        
                elif file.filename.endswith('.pdf'):
                    import fitz  # PyMuPDF
                    pdf_doc = fitz.open(stream=file.read(), filetype="pdf")
                    resume_text = ""
                    for page in pdf_doc:
                        resume_text += page.get_text()
        
                else:
                    resume_text = file.read().decode('utf-8', errors='ignore')

                if not resume_text.strip():
                    resume_text = "The file appears to be empty or cannot be properly read."
            except Exception as e:
               return jsonify({'feedback': f"Error reading file: {str(e)}"})
    
    # If no file or file processing failed, check for text input
    if not resume_text and 'resume_text' in request.form:
        resume_text = request.form['resume_text']
    
    # If still no resume text, return an error
    if not resume_text:
        return jsonify({'feedback': 'Please provide a resume text or upload a valid text file.'})
    
    # Get structured feedback from Groq
    feedback = ask_groq(resume_text, feature_id)
    
    return jsonify({
        'feedback': feedback,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/get_market_insights', methods=['POST'])
def get_market_insights():
    topic = request.form['topic']
    feature_id = "3"  # Market insights feature
    
    # Get structured insights from Groq
    insights = ask_groq(topic, feature_id)
    
    return jsonify({
        'insights': insights,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/get_college_advice', methods=['POST'])
def get_college_advice():
    major = request.form['major']
    feature_id = "4"  # College advice feature
    
    # Get structured advice from Groq
    advice = ask_groq(major, feature_id)
    
    return jsonify({
        'advice': advice,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/get_interview_tips', methods=['POST'])
def get_interview_tips():
    role = request.form['role']
    feature_id = "5"  # Interview tips feature
    
    # Get structured tips from Groq
    tips = ask_groq(role, feature_id)
    
    return jsonify({
        'tips': tips,
        'chat_history': get_chat_history(feature_id)
    })

@app.route('/get_chat_history', methods=['POST'])
def retrieve_chat_history():
    feature_id = request.form['feature_id']
    return jsonify({
        'chat_history': get_chat_history(feature_id)
    })

if __name__ == '__main__':
    app.run(debug=True)