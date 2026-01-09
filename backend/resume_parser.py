import json
import google.generativeai as genai

def extract_resume_skills(resume_text, target_skills, api_key, model_name='gemini-1.5-flash'):
    """
    Parses a Resume to find years of experience for specific target skills.
    
    Args:
        resume_text (str): The text content of the resume.
        target_skills (list): A list of skill names to look for.
        api_key (str): The Google Gemini API key.
        
    Returns:
        dict: A dictionary mapping found skills to years of experience (int).
              Example: {"Python": 4, "SQL": 2}
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    
    skills_str = ", ".join(target_skills)
    
    prompt = f"""
    You are an expert Resume Parser. 
    Analyze the following resume text and determine the years of experience for the following specific skills: {skills_str}.
    
    For each skill found, estimate the years of experience based on the dates and context provided in the resume.
    If a skill is not found or experience cannot be determined, do not include it in the output.
    Round to the nearest integer year.
    
    Return the output strictly as a valid JSON object where keys are the skill names (exactly as provided in the list) and values are the integer years of experience.
    Format:
    {{
      "Python": 4,
      "SQL": 2
    }}
    
    Do not include markdown formatting.
    
    Resume Text:
    {resume_text}
    """
    
    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        return json.loads(text_response)
    except Exception as e:
        print(f"Error parsing Resume: {e}")
        return {}
