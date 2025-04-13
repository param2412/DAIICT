import os
import re
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    """Check if the file type is allowed"""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file):
    """Extract text content from uploaded file"""
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower()
    
    if ext == 'txt':
        return file.read().decode('utf-8')
    elif ext in ['doc', 'docx', 'pdf']:
        # Return message to manually paste text for now
        return "File format detected. For best results, please copy and paste the text content directly."
    
    return ""

def format_response_text(text, feature_id):
    """Format AI response text with appropriate HTML structure"""
    # Basic sanitization
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    
    if feature_id == "1":  # Career path suggestions
        # Try to extract sections using regex
        sections = {}
        patterns = {
            'careers': r'Top 5 Recommended Careers:(.*?)(?:Key Skills Needed:|$)',
            'skills': r'Key Skills Needed:(.*?)(?:Education Requirements:|$)',
            'education': r'Education Requirements:(.*?)(?:Quick Starting Tips:|$)',
            'tips': r'Quick Starting Tips:(.*?)$'
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.DOTALL)
            if match:
                sections[key] = match.group(1).strip()
        
        if sections:
            formatted = '<div class="response-section">'
            
            if 'careers' in sections:
                formatted += '<h4>Top 5 Recommended Careers:</h4><ul>'
                careers = re.split(r'[\n•-]+', sections['careers'])
                for career in careers:
                    if career.strip():
                        formatted += f'<li>{career.strip()}</li>'
                formatted += '</ul>'
            
            if 'skills' in sections:
                formatted += '<h4>Key Skills Needed:</h4><ul>'
                skills = re.split(r'[\n•-]+', sections['skills'])
                for skill in skills:
                    if skill.strip():
                        formatted += f'<li>{skill.strip()}</li>'
                formatted += '</ul>'
            
            if 'education' in sections:
                formatted += f'<h4>Education Requirements:</h4><p>{sections["education"]}</p>'
            
            if 'tips' in sections:
                formatted += '<h4>Quick Starting Tips:</h4><ul>'
                tips = re.split(r'[\n•-]+', sections['tips'])
                for tip in tips:
                    if tip.strip():
                        formatted += f'<li>{tip.strip()}</li>'
                formatted += '</ul>'
            
            formatted += '</div>'
            return formatted
    
    elif feature_id == "2":  # Resume feedback
        # Format resume feedback
        patterns = {
            'strengths': r'Strengths.*?(?:Areas to Improve|$)',
            'improvements': r'Areas to Improve.*?(?:ATS Score|$)',
            'ats': r'ATS Score:.*?(?:\d+/10)',
            'recommendation': r'(?:One sentence final recommendation|final recommendation).*?$'
        }
        
        sections = {}
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                sections[key] = match.group(0).strip()
        
        if sections:
            formatted = '<div class="response-section">'
            
            if 'strengths' in sections:
                formatted += f'<div class="feedback-item positive"><h4>💪 Strengths</h4><p>{sections["strengths"].replace("Strengths", "")}</p></div>'
            
            if 'improvements' in sections:
                formatted += f'<div class="feedback-item negative"><h4>🔍 Areas to Improve</h4><p>{sections["improvements"].replace("Areas to Improve", "")}</p></div>'
            
            if 'ats' in sections:
                formatted += f'<div class="feedback-item"><h4>🤖 ATS Score</h4><p>{sections["ats"].replace("ATS Score:", "")}</p></div>'
            
            if 'recommendation' in sections:
                formatted += f'<div class="feedback-item recommendation"><h4>💡 Recommendation</h4><p>{sections["recommendation"].replace("One sentence final recommendation", "").replace("final recommendation", "")}</p></div>'
            
            formatted += '</div>'
            return formatted
    
    # Default formatting: convert newlines to <br> and add basic styling
    formatted = '<div class="ai-formatted-response">'
    
    # Convert numbered lists
    text = re.sub(r'(\d+\.\s*)', r'<strong>\1</strong>', text)
    
    # Convert bullet points
    text = re.sub(r'[-•]\s*', '• ', text)
    
    # Handle line breaks
    paragraphs = text.split('\n\n')
    for p in paragraphs:
        if p.strip():
            lines = p.split('\n')
            formatted_p = '<p>' + '<br>'.join(lines) + '</p>'
            formatted += formatted_p
    
    formatted += '</div>'
    return formatted

def get_feature_name(feature_id):
    """Get the feature name based on feature_id"""
    features = {
        "1": "Career path suggestions",
        "2": "Resume/CV feedback",
        "3": "Job market insights",
        "4": "College/major advice",
        "5": "Interview preparation tips"
    }
    return features.get(feature_id, "Unknown feature")
