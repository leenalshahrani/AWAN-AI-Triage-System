# AWAN — AI-Powered Early Warning & Triage Support System

AWAN is an academic AI project designed to support **early triage for stroke and angina** using patient-reported symptoms and basic health information. The system classifies cases into an urgent **Red** pathway or a non-urgent **Green** pathway and presents the predicted condition with supporting information for staff review.

> **Important:** AWAN is a research/academic prototype. It is **not a medical device** and must not be used for clinical diagnosis or treatment decisions.

## Project Overview

AWAN was developed as a full-stack graduation project that combines machine learning with a web-based clinical workflow. It includes a patient-facing assessment flow, staff dashboards, an API backend, database integration, and trained ML artifacts for stroke and heart-risk triage.

### Core capabilities

- Patient symptom and general-health data collection
- AI-assisted screening for **stroke** and **angina/heart-risk** cases
- Red/Green triage output for rapid case prioritization
- Confidence-aware prediction output from the AI service
- Staff view for alerts, case review, and patient records
- Authentication, audit logging, and administrative controls
- Fallback rule-based classification when the external AI service is unavailable

## AI / ML Pipeline

The repository contains trained model artifacts and preprocessing components for two parallel urgency assessments:

- **Stroke triage model**
- **Heart / angina triage model**

The AI service processes patient characteristics and risk factors, generates probabilities for both assessments, and maps the highest-risk result to the system's triage output. The backend integrates this service through a local API and stores the resulting classification with the patient case.

The model configuration files include engineered features such as age-related risk interactions, hypertension and heart-disease history, BMI-derived features, chest-pain type, and exercise-induced angina.

## System Architecture

```text
Patient / Staff UI
       │
       ▼
React + TypeScript Frontend
       │
       ▼
FastAPI Backend ───────► MySQL Database
       │
       ▼
Local AI Triage Service
       │
       ├── Stroke model
       └── Heart / angina model
```

If the AI service cannot be reached, the backend can fall back to an internal heuristic classifier so the prototype workflow remains available.

## Tech Stack

**AI / Data**
- Python
- scikit-learn
- NumPy
- Jupyter Notebook

**Backend**
- FastAPI
- SQLAlchemy
- PyMySQL
- Pydantic
- JWT-based authentication

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- i18next

**Database**
- MySQL

## Repository Structure

```text
AWAN-AI-Triage-System/
├── AI/
│   ├── AI-Finalserv.ipynb
│   └── production_models/
├── backend/
│   ├── app/
│   ├── schema.sql
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Local Setup

### 1. Create the database

Create a MySQL database named `std_awan` and import the schema:

```sql
CREATE DATABASE std_awan;
```

Then import:

```text
backend/schema.sql
```

The public repository contains **schema only**; local demo/user records are intentionally excluded.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8080
```

Update the values in `.env` for your local MySQL instance and set your own secret key.

### 3. Start the AI service

```bash
cd AI
```

Open `AI-Finalserv.ipynb` and run the notebook cells to start the local triage service. The backend expects the service at:

```text
http://127.0.0.1:8000/triage
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Typical Workflow

1. A patient enters identifying information, symptoms, and health details.
2. The backend prepares the clinical input and sends it to the AI triage service.
3. Stroke and heart-risk models generate urgency probabilities.
4. AWAN returns a Red or Green triage result and stores the case.
5. Staff can review alerts and case information through the dashboard.

## Academic Context

AWAN was developed as a **Computer Science graduation project at King Khalid University**, with a focus on applying AI to time-sensitive healthcare triage and building an end-to-end system around the ML component.

## Privacy & Safety

- Real credentials and local environment files are excluded from this repository.
- The included database file is schema-only and contains no patient/demo records.
