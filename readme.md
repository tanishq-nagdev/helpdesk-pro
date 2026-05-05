Here’s the **clean README content** — just copy-paste into your `README.md` 👇

---

```md
# 🚀 HelpDesk Pro – IT Ticketing System

A cloud-ready HelpDesk web application built with Flask and Docker.  
Employees can create support tickets, and admins can manage and resolve them.

---

## 📌 Features

- User Authentication (Login/Register)
- Create and track support tickets
- Admin dashboard
- Ticket status tracking (Open, In Progress, Resolved)
- Docker support
- Automated testing (pytest)

---

## 🛠️ Tech Stack

- Python (Flask)
- SQLite
- HTML + Bootstrap
- Docker
- Pytest

---

## ⚙️ Run Locally

### 1. Clone the repo
```

git clone <your-repo-link>
cd helpdesk-pro

```

### 2. Create virtual environment
```

py -3.10 -m venv venv
venv\Scripts\activate

```

### 3. Install dependencies
```

pip install -r requirements.txt

```

### 4. Run the app
```

python app.py

```

### Open in browser
```

[http://localhost:5000](http://localhost:5000)

```

---

## 🔑 Demo Login

```

Admin:
admin / admin123

User:
john / john123

```

---

## 🧪 Run Tests

```

pytest

```

---

## 🐳 Run with Docker

### Build
```

docker build -t helpdesk-pro .

```

### Run
```

docker run -p 5000:5000 helpdesk-pro

```

---

## 🐳 Run with Docker Compose

```

docker compose up --build

```

---

## 📦 Notes

- Database is stored in `/data`
- Docker Compose keeps data persistent
- `.gitignore` excludes venv and database

---

## 👨‍💻 Project

DevOps project demonstrating CI/CD pipeline with Docker and cloud deployment.
```

---