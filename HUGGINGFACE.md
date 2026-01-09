# Deploying to Hugging Face Spaces

This project uses **Docker** to run both the React Frontend and FastAPI Backend in a single container on Hugging Face Spaces.

## 1. Create a New Space
1.  Go to [huggingface.co/spaces](https://huggingface.co/spaces).
2.  Click **"Create new Space"**.
3.  **Owner**: Select your username.
4.  **Space Name**: `SkillRank-AI` (or similar).
5.  **SDK**: Select **Docker**.
6.  **Public/Private**: Public is fine.

## 2. Push Code to Space
You can push your code directly to the Space's git repository.

```bash
# 1. Initialize git if you haven't (skip if you already have the repo setup)
# cd resume_screening_tool

# 2. Add Hugging Face remote (Copy the HTTPS URL from your Space)
git remote add space https://huggingface.co/spaces/<YOUR_USERNAME>/SkillRank-AI

# 3. Push to the Space
git push space main
```

## 3. Configuration
- The `Dockerfile` handles everything (building frontend, installing backend deps).
- It runs on port `7860` (standard for Spaces).
- No environment variables are strictly required since the API Key is entered by the user in the UI.

## Troubleshooting
- If the build fails, check the **Logs** tab in your Space.
- The first build might take a few minutes as it compiles the React app.
