# AWAN Backend

FastAPI backend for handling patient data and classification logic.

---

## 🚀 Features

* Patient management
* Clinical data processing
* Risk classification
* Logging & analytics

---

## ⚙️ Setup

```bash id="b1"
pip install -r requirements.txt
pip install email-validator
python -m uvicorn app.main:app --reload --port 8080
```

---

## 🔑 Environment

Create `.env` from `.env.example`

---

## 📡 Endpoints

* POST `/api/v1/auth/patient-login`
* POST `/api/v1/classification/`
* GET `/api/v1/analytics/dashboard`

---

## 🧠 AI Integration

* Uses external AI service
* Falls back to internal classifier

---

## 💾 Database

* MySQL (XAMPP)
* Import `schema.sql` before running

---
