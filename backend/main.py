from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import json
import shutil
import os
import asyncio
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pypdf import PdfReader

# Import existing logic
from jd_parser import parse_jd
from resume_parser import extract_resume_skills
from scorer import calculate_score

app = FastAPI(title="Resume Screening API")

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JDParsingRequest(BaseModel):
    jd_text: str
    api_key: str
    model_name: str = "gemini-1.5-flash"

class ScreenResumeRequest(BaseModel):
    jd_skills: Dict
    api_key: str
    model_name: str = "gemini-1.5-flash"

@app.post("/api/parse-jd")
async def api_parse_jd(request: JDParsingRequest):
    """
    Parses a Job Description.
    """
    print(f"API CALL: /api/parse-jd with model={request.model_name}")
    # Force clean API key
    clean_key = request.api_key.strip()
    print(f"DEBUG: Key length received: {len(request.api_key)}, Cleaned: {len(clean_key)}")
    if not clean_key:
         raise HTTPException(status_code=400, detail="API Key is empty")
         
    try:
        jd_data = parse_jd(request.jd_text, clean_key, request.model_name)
        if "error" in jd_data:
            print(f"API ERROR: {jd_data['error']}")
            raise HTTPException(status_code=400, detail=jd_data["error"])
        print("API SUCCESS: JD parsed.")
        return jd_data
    except Exception as e:
        print(f"API EXCEPTION: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/screen-resumes")
async def api_screen_resumes(
    files: List[UploadFile] = File(...),
    jd_skills_json: str = Form(...),
    api_key: str = Form(...),
    model_name: str = Form("gemini-1.5-flash")
):
    """
    Screens uploaded resumes against the provided JD skills.
    """
    try:
        jd_skills = json.loads(jd_skills_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JD Skills JSON")

    results = []
    target_skills_list = list(jd_skills.keys())
    
    # Create tasks for all files
    tasks = []
    
    import asyncio
    from functools import partial

    loop = asyncio.get_running_loop()
    
    async def process_file(file):
        try:
            print(f"Processing file: {file.filename}")
            # Read file content
            content = await file.read()
            
            if file.filename.endswith(".pdf"):
                import io
                pdf_file = io.BytesIO(content)
                reader = PdfReader(pdf_file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
            else:
                text = str(content, "utf-8")
            
            # Parse Resume (Blocking Call - Run in ThreadPool)
            clean_key = api_key.strip()
            func = partial(extract_resume_skills, text, target_skills_list, clean_key, model_name)
            resume_skills = await loop.run_in_executor(None, func)
            
            # Score
            score, missing_skills = calculate_score(jd_skills, resume_skills)
            
            print(f"Finished processing: {file.filename}")
            return {
                "filename": file.filename,
                "score": score,
                "resume_skills": resume_skills,
                "missing_skills": missing_skills
            }
            
        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")
            return {
                "filename": file.filename,
                "error": str(e),
                "score": 0
            }

    tasks = [process_file(file) for file in files]
    results = await asyncio.gather(*tasks)

    # Sort by score descending
    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Resume Screening API is running"}

# Serve Static Files (React App) if directory exists (for Docker/HF Spaces)
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist_path):
    print(f"Serving static files from: {frontend_dist_path}")
    
    # Mount assets first (e.g. /assets/index-D7...js)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    # Serve index.html for root and any subpath (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't catch API routes here (they are already defined above)
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
            
        # Return index.html for known frontend routes
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))

else:
    print("Frontend Build not found. Running in API-only mode.")
    @app.get("/")
    def read_root():
        return {"status": "ok", "message": "Resume Screening API is running (Frontend build not found)"}
