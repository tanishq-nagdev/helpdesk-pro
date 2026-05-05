# ---------- Base Image ----------
# Use official lightweight Python image
FROM python:3.11-slim

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Install Dependencies ----------
# Copy requirements first (better caching)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ---------- Copy Project Files ----------
COPY . .

# ---------- Create Data Directory ----------
# For SQLite database storage
RUN mkdir -p data

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Environment ----------
ENV FLASK_ENV=production

# ---------- Run App ----------
# Use Gunicorn (production server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]