import streamlit as st
import pandas as pd
from pypdf import PdfReader
from jd_parser import parse_jd
from resume_parser import extract_resume_skills
from scorer import calculate_score
import os

st.set_page_config(page_title="Resume Screening & Stack Ranking Tool", layout="wide")

st.title("Resume Screening & Stack Ranking Tool")

# Sidebar for specific controls
with st.sidebar:
    st.header("Configuration")
    api_key = st.text_input("Enter Gemini API Key", type="password")
    
    # Dynamic Model Selection
    model_name = st.text_input("Model Name", value="gemini-1.5-flash")
    
    if st.button("List Available Models"):
        if not api_key:
            st.error("Enter API Key first!")
        else:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                models = []
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        models.append(m.name)
                st.success(f"Found {len(models)} models")
                st.code("\n".join(models))
            except Exception as e:
                st.error(f"Error listing models: {e}")

    if not api_key:
        st.warning("Please enter your API Key to proceed.")

def read_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

# Main Content
col1, col2 = st.columns(2)

jd_data = None
target_skills_list = []

with col1:
    st.subheader("Job Description")
    jd_text = st.text_area("Paste Job Description Here", height=300)
    
    if st.button("Parse JD"):
        if not api_key:
            st.error("API Key required!")
        elif jd_text:
            with st.spinner("Parsing JD..."):
                jd_data = parse_jd(jd_text, api_key, model_name)
                if jd_data and "error" not in jd_data:
                    st.success("JD Parsed Successfully!")
                    st.json(jd_data) # Display parsed structure
                    st.session_state['jd_data'] = jd_data
                elif jd_data and "error" in jd_data:
                    st.error(f"Failed to parse JD: {jd_data['error']}")
                else:
                    st.error("Failed to parse JD. Unknown error.")

if 'jd_data' in st.session_state:
    jd_data = st.session_state['jd_data']
    target_skills_list = list(jd_data.keys())

with col2:
    st.subheader("Upload Resumes")
    uploaded_files = st.file_uploader("Upload Resumes (PDF or TXT)", type=["pdf", "txt"], accept_multiple_files=True)
    
    if st.button("Screen Resumes"):
        if not api_key:
            st.error("API Key required!")
        elif not jd_data:
            st.error("Please parse a JD first!")
        elif not uploaded_files:
            st.error("Please upload resumes!")
        else:
            results = []
            
            progress_bar = st.progress(0)
            for i, uploaded_file in enumerate(uploaded_files):
                # Read Text
                if uploaded_file.type == "application/pdf":
                    resume_text = read_pdf(uploaded_file)
                else:
                    resume_text = str(uploaded_file.read(), "utf-8")
                
                # Parse
                resume_skills = extract_resume_skills(resume_text, target_skills_list, api_key, model_name)
                
                # Score
                score, missing_skills = calculate_score(jd_data, resume_skills)
                
                # Collect Result
                results.append({
                    "Candidate File": uploaded_file.name,
                    "Total Match Score": score,
                    "Top Skills Found": ", ".join([f"{k} ({v}y)" for k,v in resume_skills.items()]),
                    "Missing Key Skills": ", ".join(missing_skills)
                })
                progress_bar.progress((i + 1) / len(uploaded_files))
            
            # Display Results
            st.subheader("Ranking Results")
            # Convert results to DataFrame
            if results:
                df = pd.DataFrame(results)
                df = df.sort_values(by="Total Match Score", ascending=False)
                st.dataframe(df, use_container_width=True)
                
                # Highlight Top 5
                st.write("### Top 5 Candidates")
                st.table(df.head(5))
            else:
                st.info("No results generated.")

