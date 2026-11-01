# API Endpoints Documentation

## Complete API Reference

### Authentication (`/api/v1/auth`)
- `POST /login` - Login with username/password (OAuth2)
  - Body: `username`, `password`
  - Returns: `access_token`, `token_type`
- `GET /me` - Get current user info (requires auth token)

### Classification (`/api/v1/classification`)
- `POST /` - Classify patient risk
  - Body: `patient` (PatientCreate), `clinical_data` (ClinicalEntryBase)
  - Returns: Full classification result with response time
- `GET /case/{entry_id}` - Get case details by entry ID

### Patients (`/api/v1/patients`)
- `POST /` - Create new patient
- `GET /{patient_id}` - Get patient by ID
- `GET /` - List all patients (paginated: `skip`, `limit`)

### Cases (`/api/v1/cases`)
- `GET /` - List all cases with filters
  - Query params: `skip`, `limit`, `risk_color`, `start_date`, `end_date`
- `GET /{entry_id}` - Get full case details (patient + clinical + classification)

### Analytics (`/api/v1/analytics`)
- `GET /dashboard` - Dashboard statistics
  - Returns: total_cases, high_risk_count, low_risk_count, avg_response_time_ms, classification_breakdown, daily_cases
- `GET /performance?days=7` - Performance metrics for last N days
- `GET /recent-cases?limit=10` - Recent cases list

### Users (`/api/v1/users`)
- `POST /` - Create new user
  - Body: `username`, `email`, `full_name`, `role`, `password`
- `GET /` - List all users (paginated)
- `GET /{user_id}` - Get user by ID
- `PUT /{user_id}` - Update user
- `DELETE /{user_id}` - Delete user

### Symptoms (`/api/v1/symptoms`)
- `POST /` - Create new symptom
  - Body: `symptom`, `category`, `severity`, `description`, `status`
- `GET /` - List all symptoms (paginated)
- `GET /{symptom_id}` - Get symptom by ID
- `PUT /{symptom_id}` - Update symptom
- `DELETE /{symptom_id}` - Delete symptom

### Audit Logs (`/api/v1/audit`)
- `POST /` - Create audit log entry
  - Body: `action`, `user`, `status`
- `GET /` - List audit logs (paginated, ordered by timestamp desc)

### Health Check
- `GET /health` - API health status

## Frontend Integration

All APIs are designed to match the frontend service layer:
- `/api/v1/classification/` → `clinicalService.submitClinicalData()`
- `/api/v1/patients/{id}` → `clinicalService.getPatient()`
- `/api/v1/cases` → `clinicalService.getAllCases()`
- `/api/v1/analytics/dashboard` → Admin dashboard stats
- `/api/v1/users` → User management (admin)
- `/api/v1/symptoms` → AI data management (admin)
- `/api/v1/audit` → Audit logs (admin)

## Database Tables Required

Additional tables needed (run these in MySQL):

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Symptoms table
CREATE TABLE symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symptom VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT TRUE
);

-- Audit logs table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(200) NOT NULL,
    user VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
