# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.9-slim
WORKDIR /app

# Copy backend code
COPY backend/ /app/backend/

# Install Python requirements
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create directory for static files and copy from frontend-builder
RUN mkdir -p /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port (Hugging Face Spaces uses 7860)
EXPOSE 7860

# Set environment variable for backend imports
ENV PYTHONPATH=/app/backend

# Run the application
# We run uvicorn on port 7860 and listen on all interfaces
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
