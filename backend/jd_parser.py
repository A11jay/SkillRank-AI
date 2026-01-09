import json
import google.generativeai as genai

def parse_jd(jd_text, api_key, model_name='gemini-1.5-flash'):
    """
    Parses a Job Description to extract skills and their priorities using Gemini.
    
    Args:
        jd_text (str): The text of the Job Description.
        api_key (str): The Google Gemini API key.
        
    Returns:
        dict: A dictionary mapping skills to their priority and weight.
              Example:
              {
                  "Python": {"priority": "Must-Have", "weight": 3},
                  "SQL": {"priority": "Nice-to-Have", "weight": 1}
              }
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    
    prompt = f"""
    You are an expert HR AI. Your task is to extract technical skills from the following Job Description.
    Categorize each skill as either "Must-Have" or "Nice-to-Have".
    Assign a weight of 3 for "Must-Have" and 1 for "Nice-to-Have".
    
    Return the output strictly as a valid JSON object with the skill name as the key.
    The format should be:
    {{
      "Skill Name": {{"priority": "Must-Have", "weight": 3}},
      "Another Skill": {{"priority": "Nice-to-Have", "weight": 1}}
    }}
    
    Do not include markdown formatting (like ```json). Just the raw JSON string.
    
    Job Description:
    {jd_text}
    """
    
    try:
        print(f"DEBUG: Generating content with model {model_name}...")
        response = model.generate_content(prompt)
        print("DEBUG: Content generated.")
        # Clean up potential markdown formatting if the model adds it despite instructions
        text_response = response.text.strip()
        print(f"DEBUG: Raw response: {text_response[:100]}...") # Print first 100 chars
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        print("DEBUG: JSON parsing...")
        return json.loads(text_response)
    except Exception as e:
        print(f"ERROR inside parse_jd: {str(e)}")
        return {"error": str(e)}
