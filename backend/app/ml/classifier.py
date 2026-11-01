import numpy as np
import requests
from datetime import date
from typing import Tuple, Dict, Optional
from app.core.config import get_settings

TRIAGE_API_URL = "http://127.0.0.1:8000/triage"

ANGINA_SYMPTOMS = {'chest pain', 'shortness of breath', 'heart palpitations', 'sweating', 'nausea'}
STROKE_SYMPTOMS = {'severe headache', 'vision problems', 'confusion', 'loss of consciousness',
                   'severe bleeding', 'loss of appetite', 'back pain', 'numbness in arm',
                   'numbness', 'dizziness'}

class RiskClassifierService:
    def __init__(self):
        self.settings = get_settings()

    def predict(self, clinical_data: Dict, patient_data: Optional[Dict] = None) -> Tuple[str, str, float, bool]:
        if patient_data:
            try:
                result = self._call_ml_api(clinical_data, patient_data)
                if result:
                    return (*result, False)
            except Exception:
                pass
        return (*self._heuristic_predict(clinical_data), True)

    def _call_ml_api(self, clinical_data: Dict, patient_data: Dict) -> Optional[Tuple[str, str, float]]:
        dob = patient_data.get('date_of_birth')
        if not dob:
            return None
        if isinstance(dob, str):
            try:
                dob = date.fromisoformat(dob)
            except ValueError:
                return None
        age = (date.today() - dob).days / 365.25

        height_cm = clinical_data.get('height_cm')
        weight_kg = clinical_data.get('weight_kg')
        if not height_cm or not weight_kg:
            return None

        gender_map = {'M': 'Male', 'F': 'Female', 'O': 'Other'}
        gender = gender_map.get(patient_data.get('gender') or '', 'Other')

        payload = {
            "age":             round(float(age), 1),
            "gender":          gender,
            "height_cm":       float(height_cm),
            "weight_kg":       float(weight_kg),
            "hypertension":    int(clinical_data.get('hypertension') or 0),
            "heart_disease":   int(clinical_data.get('heart_disease_hx') or 0),
            "ever_married":    clinical_data.get('ever_married') or 'No',
            "work_type":       clinical_data.get('work_type') or 'Private',
            "Residence_type":  clinical_data.get('residence_type') or 'Urban',
            "smoking_status":  clinical_data.get('smoking_status') or 'Unknown',
            "chest_pain_type": int(clinical_data.get('chest_pain_type') or 4),
            "exercise_angina": int(clinical_data.get('exercise_angina') or 0),
        }

        resp = requests.post(TRIAGE_API_URL, json=payload, timeout=4)
        resp.raise_for_status()
        return self._parse_api_response(resp.json())

    def _parse_api_response(self, data: Dict) -> Tuple[str, str, float]:
        details       = data.get('details', {})
        stroke_prob   = details.get('stroke_assessment', {}).get('probability', 0.0)
        heart_prob    = details.get('heart_assessment',  {}).get('probability', 0.0)
        overall       = data.get('overall_status', 'STABLE')

        if overall == 'EMERGENCY':
            if stroke_prob >= heart_prob:
                classification = 'Stroke'
            else:
                classification = 'Angina Pectoris'
            risk_color       = 'Red'
            confidence_score = round(max(stroke_prob, heart_prob) * 100, 1)
        else:
            classification   = 'Low Risk'
            risk_color       = 'Green'
            confidence_score = round((1 - max(stroke_prob, heart_prob)) * 100, 1)

        return classification, risk_color, confidence_score

    def _heuristic_predict(self, clinical_data: Dict) -> Tuple[str, str, float]:
        severity     = (clinical_data.get('severity') or '').lower()
        pain_type    = (clinical_data.get('pain_type') or '').lower()
        pain_location= (clinical_data.get('pain_location') or '').lower()
        numbness     = clinical_data.get('numbness', False)
        other        = (clinical_data.get('other_symptoms') or '').lower()

        all_symptoms_text = f"{pain_type} {pain_location} {other}"

        angina_score = sum(1 for s in ANGINA_SYMPTOMS if s in all_symptoms_text)
        stroke_score = sum(1 for s in STROKE_SYMPTOMS if s in all_symptoms_text)
        if numbness:
            stroke_score += 1

        severity_boost = {'severe': 1.5, 'moderate': 1.1, 'mild': 0.9}.get(severity, 1.0)
        angina_score  *= severity_boost
        stroke_score  *= severity_boost

        if angina_score >= 1 and angina_score >= stroke_score:
            classification   = 'Angina Pectoris'
            risk_color       = 'Red'
            confidence_score = min(98.0, 80.0 + angina_score * 5)
        elif stroke_score >= 1:
            classification   = 'Stroke'
            risk_color       = 'Red'
            confidence_score = min(98.0, 80.0 + stroke_score * 5)
        else:
            classification   = 'Low Risk'
            risk_color       = 'Green'
            confidence_score = 85.0

        if confidence_score < (self.settings.sensitivity_threshold * 100):
            classification = 'Non-Classified'
            risk_color     = 'Green'

        return classification, risk_color, round(confidence_score, 1)
