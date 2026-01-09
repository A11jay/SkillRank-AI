# Deploying SkillRank AI to Vercel

This project is configured to be deployed as a full-stack application (Python Backend + React Frontend) on Vercel.

## Deployment Steps

1.  **Install Vercel CLI** (if you haven't already):
    ```bash
    npm i -g vercel
    ```

2.  **Login to Vercel**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Run the following command in the root `resume_screening_tool` directory:
    ```bash
    vercel
    ```

    Follow the prompts:
    - Set up and deploy? **Y**
    - Which scope? **(Select your account)**
    - Link to existing project? **N**
    - Project Name? **(Press Enter or type a name)**
    - In which directory is your code located? **./**
    - Want to modify these settings? **N** (The `vercel.json` handles configuration automatically).

4.  **Production Deployment**:
    Once tested, deploy to production:
    ```bash
    vercel --prod
    ```

## Configuration Details

- **`vercel.json`**: This file tells Vercel how to build the app.
    - It routes `/api/*` requests to the `backend/main.py` (which runs as a Serverless Function).
    - It routes all other requests to the `frontend` static build.
- **Frontend**: Built using Vite (`npm run build`), outputting to `dist`.
- **Backend**: Runs on Vercel's Python environment using `requirements.txt`.

## Troubleshooting

- **Check logs**: If the API fails, check the "Functions" logs in your Vercel Dashboard.
- **Environment Variables**: If you want to store the API Key on the server (optional), adding it to Vercel Environment Variables won't automatically make the frontend see it unless you expose it or use a proxy endpoint. For this app, the API Key is entered by the user in the UI, so no server-side env vars are strictly required.
