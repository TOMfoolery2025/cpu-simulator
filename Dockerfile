# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Backend + static files
FROM python:3.12-slim
WORKDIR /app

# Install backend deps
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend into Flask static directory
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV FLASK_APP=backend/app.py
ENV PYTHONPATH=/app

EXPOSE 5000

CMD ["python", "-m", "backend.app"]
