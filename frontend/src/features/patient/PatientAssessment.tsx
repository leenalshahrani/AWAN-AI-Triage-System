import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Check, Heart, Wind, Zap, Eye, Brain, Activity,
  Droplet, AlertCircle, Thermometer, Waves, Loader2,
  BrainCircuit, Bone, Apple, PowerOff,
} from 'lucide-react';
import { Button } from '@components/common/Button';
import { clinicalService } from '@services/clinical.service';
import { authService } from '@services/auth.service';
import type { SymptomRecord } from '@/types/index';

const ICON_MAP: Record<string, JSX.Element> = {
  'Chest Pain':            <Heart className="w-5 h-5" />,
  'Shortness of Breath':   <Wind className="w-5 h-5" />,
  'Numbness in Arm':       <Zap className="w-5 h-5" />,
  'Dizziness':             <Activity className="w-5 h-5" />,
  'Severe Headache':       <Brain className="w-5 h-5" />,
  'Headache':              <Brain className="w-5 h-5" />,
  'Nausea':                <Droplet className="w-5 h-5" />,
  'Fatigue':               <AlertCircle className="w-5 h-5" />,
  'Vision Problems':       <Eye className="w-5 h-5" />,
  'Sweating':              <Thermometer className="w-5 h-5" />,
  'Heart Palpitations':    <Waves className="w-5 h-5" />,
  'Confusion':             <BrainCircuit className="w-5 h-5" />,
  'Back Pain':             <Bone className="w-5 h-5" />,
  'Loss of Appetite':      <Apple className="w-5 h-5" />,
  'Loss of Consciousness': <PowerOff className="w-5 h-5" />,
};

const FALLBACK_SYMPTOMS: SymptomRecord[] = [
  { id: 1,  symptom: 'Chest Pain',            category: 'Cardiovascular',   severity: 'High',   status: true },
  { id: 2,  symptom: 'Shortness of Breath',   category: 'Respiratory',      severity: 'High',   status: true },
  { id: 3,  symptom: 'Numbness in Arm',       category: 'Cardiovascular',   severity: 'Medium', status: true },
  { id: 4,  symptom: 'Severe Headache',       category: 'Neurological',     severity: 'High',   status: true },
  { id: 5,  symptom: 'Nausea',               category: 'Gastrointestinal', severity: 'Low',    status: true },
  { id: 6,  symptom: 'Dizziness',             category: 'Neurological',     severity: 'Medium', status: true },
  { id: 7,  symptom: 'Sweating',              category: 'General',          severity: 'Medium', status: true },
  { id: 8,  symptom: 'Heart Palpitations',    category: 'Cardiovascular',   severity: 'High',   status: true },
  { id: 9,  symptom: 'Vision Problems',       category: 'Neurological',     severity: 'High',   status: true },
  { id: 10, symptom: 'Fatigue',               category: 'General',          severity: 'Low',    status: true },
  { id: 11, symptom: 'Confusion',             category: 'Neurological',     severity: 'High',   status: true },
  { id: 12, symptom: 'Back Pain',             category: 'Musculoskeletal',  severity: 'Medium', status: true },
  { id: 13, symptom: 'Loss of Appetite',      category: 'Gastrointestinal', severity: 'Low',    status: true },
  { id: 14, symptom: 'Loss of Consciousness', category: 'Neurological',     severity: 'High',   status: true },
];

const DURATION_OPTIONS = [
  { label: 'Less than 1 hour', value: '< 1 hour' },
  { label: '1–6 hours',        value: '1-6 hours' },
  { label: '6–24 hours',       value: '6-24 hours' },
  { label: 'More than 1 day',  value: '> 24 hours' },
];

const SEVERITY_OPTIONS = [
  { label: 'Mild',     value: 'Mild',     active: 'border-green-400 text-green-700 bg-green-50' },
  { label: 'Moderate', value: 'Moderate', active: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
  { label: 'Severe',   value: 'Severe',   active: 'border-red-400 text-red-700 bg-red-50' },
];

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint text-sm';
const inputErrCls = 'border-red-400 focus:ring-red-300';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

// ── Validation helpers ────────────────────────────────────────────────────────

function validateNationalId(id: string): string {
  if (!id) return '';
  if (!/^\d+$/.test(id)) return 'National ID must contain numbers only.';
  if (id.length !== 10) return 'National ID must be exactly 10 digits.';
  return '';
}

function validateName(name: string): string {
  if (!name) return '';
  if (!/^[\u0600-\u06FFa-zA-Z\s'-]+$/.test(name))
    return 'Name may only contain letters, spaces, hyphens, or apostrophes.';
  return '';
}

function validatePhone(phone: string): string {
  if (!phone) return '';
  if (!/^05\d{8}$/.test(phone))
    return 'Phone must be 10 digits starting with 05 (e.g. 0512345678).';
  return '';
}

function validateAge(age: string): string {
  if (!age) return '';
  const n = parseInt(age, 10);
  if (isNaN(n) || n < 1 || n > 120) return 'Age must be between 1 and 120.';
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────

export const PatientAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledId = (location.state as { nationalId?: string } | null)?.nationalId ?? '';

  // Patient fields
  const [nationalId, setNationalId]   = useState(prefilledId);
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [age, setAge]                 = useState('');
  const [gender, setGender]           = useState<'M' | 'F' | 'O' | ''>('');
  const [contactInfo, setContactInfo] = useState('');
  const [returning, setReturning]     = useState(false);
  const [lookingUp, setLookingUp]     = useState(false);
  const [loggedIn, setLoggedIn]       = useState(false);

  // Validation errors
  const [nationalIdError, setNationalIdError] = useState('');
  const [firstNameError, setFirstNameError]   = useState('');
  const [lastNameError, setLastNameError]     = useState('');
  const [ageError, setAgeError]               = useState('');
  const [phoneError, setPhoneError]           = useState('');

  // Clinical fields
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration]                 = useState('');
  const [severity, setSeverity]                 = useState('');

  // Medical information fields
  const [heightCm, setHeightCm]           = useState('');
  const [weightKg, setWeightKg]           = useState('');
  const [hypertension, setHypertension]   = useState<0 | 1 | undefined>(undefined);
  const [heartDiseaseHx, setHeartDiseaseHx] = useState<0 | 1 | undefined>(undefined);
  const [everMarried, setEverMarried]     = useState<'Yes' | 'No' | undefined>(undefined);
  const [residenceType, setResidenceType] = useState<'Urban' | 'Rural' | undefined>(undefined);
  const [workType, setWorkType]           = useState('');
  const [smokingStatus, setSmokingStatus] = useState('');
  const [exerciseAngina, setExerciseAngina] = useState<0 | 1 | undefined>(undefined);

  const [symptomList, setSymptomList] = useState<SymptomRecord[]>(FALLBACK_SYMPTOMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const lastLookedUp = useRef('');

  useEffect(() => {
    clinicalService.getSymptoms().then((data) => {
      const active = data.filter((s) => s.status);
      if (active.length > 0) setSymptomList(active);
    }).catch(() => {});

    // Determine the ID to use: prefilled from start page, or from JWT
    const patientToken = authService.getPatientFromToken();
    const effectiveId = prefilledId || patientToken?.nationalId || '';

    // No ID at all → redirect back to the ID-entry page
    if (!effectiveId) {
      navigate('/patient/start', { replace: true });
      return;
    }

    setLoggedIn(true);
    setNationalId(effectiveId);
    setLookingUp(true);
    clinicalService.lookupPatientByNationalId(effectiveId).then((patient) => {
      if (patient) {
        setFirstName(patient.first_name || '');
        setLastName(patient.last_name || '');
        if (patient.date_of_birth) {
          const birthYear = new Date(patient.date_of_birth).getFullYear();
          setAge(String(new Date().getFullYear() - birthYear));
        }
        setGender((patient.gender as 'M' | 'F' | 'O') || '');
        setContactInfo(patient.contact_info || '');
        setReturning(true);
      }
    }).catch(() => {}).finally(() => setLookingUp(false));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNationalIdChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setNationalId(digits);
    setNationalIdError('');
    setReturning(false);
  };

  const handleNationalIdBlur = async () => {
    const id = nationalId.trim();
    const err = validateNationalId(id);
    if (err) { setNationalIdError(err); return; }
    if (id === lastLookedUp.current) return;
    lastLookedUp.current = id;
    setLookingUp(true);
    setReturning(false);
    const patient = await clinicalService.lookupPatientByNationalId(id);
    setLookingUp(false);
    if (patient) {
      setFirstName(patient.first_name || '');
      setLastName(patient.last_name || '');
      if (patient.date_of_birth) {
        const birthYear = new Date(patient.date_of_birth).getFullYear();
        setAge(String(new Date().getFullYear() - birthYear));
      }
      setGender((patient.gender as 'M' | 'F' | 'O') || '');
      setContactInfo(patient.contact_info || '');
      setReturning(true);
    }
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    setFirstNameError(validateName(value));
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    setLastNameError(validateName(value));
  };

  const handleAgeChange = (value: string) => {
    setAge(value);
    setAgeError(validateAge(value));
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits, max 10
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setContactInfo(digits);
    setPhoneError(validatePhone(digits));
  };

  const toggleSymptom = (name: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // ── Validation state ──────────────────────────────────────────────────────

  const hasErrors = !!(nationalIdError || firstNameError || lastNameError || ageError || phoneError);

  const isValid =
    nationalId.length === 10 &&
    /^\d{10}$/.test(nationalId) &&
    !hasErrors &&
    selectedSymptoms.length > 0 &&
    duration !== '' &&
    severity !== '';

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!isValid) return;
    const dateOfBirth = age
      ? `${new Date().getFullYear() - parseInt(age, 10)}-01-01`
      : '';
    setError('');
    setIsSubmitting(true);
    try {
      const result = await clinicalService.submitClinicalData({
        nationalId: nationalId.trim(),
        firstName,
        lastName,
        dateOfBirth,
        gender: gender || undefined,
        contactInfo,
        selectedSymptoms,
        duration,
        severity,
        heightCm:       heightCm   ? parseFloat(heightCm)   : undefined,
        weightKg:       weightKg   ? parseFloat(weightKg)   : undefined,
        hypertension,
        heartDiseaseHx,
        everMarried,
        residenceType,
        workType:       workType   || undefined,
        smokingStatus:  smokingStatus || undefined,
        
        exerciseAngina,
      });
      navigate('/patient/review', { state: { result } });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mint/5 p-4">
      <div className="max-w-2xl mx-auto py-6">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-mint">AWAN</h1>
          <p className="text-gray-500 text-sm mt-1">Emergency Triage System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">

          {/* ── National ID ── */}
          <div>
            <label className={labelCls}>
              National ID <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(10 digits)</span>
            </label>
            <div className="relative">
              <input
                value={nationalId}
                onChange={(e) => handleNationalIdChange(e.target.value)}
                onBlur={handleNationalIdBlur}
                placeholder="e.g. 1100001111"
                className={`${inputCls} ${nationalIdError ? inputErrCls : ''} ${loggedIn ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                inputMode="numeric"
                maxLength={10}
                readOnly={loggedIn}
              />
              {lookingUp && (
                <Loader2 className="w-4 h-4 text-mint animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {nationalIdError && <p className="text-red-500 text-xs mt-1">{nationalIdError}</p>}
            {loggedIn && returning && (
              <p className="text-xs text-mint mt-1 font-medium">
                Welcome back — your information has been filled automatically.
              </p>
            )}
            {loggedIn && !returning && !lookingUp && (
              <p className="text-xs text-gray-500 mt-1">
                New patient — please fill in your information below.
              </p>
            )}
          </div>

          {/* ── Patient Demographics ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-3">

              {/* First Name */}
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="First name"
                  className={`${inputCls} ${firstNameError ? inputErrCls : ''}`}
                />
                {firstNameError && <p className="text-red-500 text-xs mt-1">{firstNameError}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  placeholder="Last name"
                  className={`${inputCls} ${lastNameError ? inputErrCls : ''}`}
                />
                {lastNameError && <p className="text-red-500 text-xs mt-1">{lastNameError}</p>}
              </div>

              {/* Age */}
              <div>
                <label className={labelCls}>Age</label>
                <select
                  value={age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={`${inputCls} ${ageError ? inputErrCls : ''}`}
                >
                  <option value="">Select age</option>
                  {Array.from({ length: 120 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>{n} years old</option>
                  ))}
                </select>
                {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className={labelCls}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'O' | '')}
                  className={inputCls}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div className="col-span-2">
                <label className={labelCls}>
                  Phone Number
                  <span className="text-gray-400 font-normal ml-1">(optional — 05XXXXXXXX)</span>
                </label>
                <input
                  value={contactInfo}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 0512345678"
                  className={`${inputCls} ${phoneError ? inputErrCls : ''}`}
                  inputMode="numeric"
                  maxLength={10}
                />
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>
            </div>
          </div>

          {/* ── Medical Information ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Medical Information</h3>
            <div className="space-y-4">

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    min={50}
                    max={250}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 75"
                    min={10}
                    max={300}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Hypertension & Heart Disease */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hypertension</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setHypertension(1)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${hypertension === 1 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Yes
                    </button>
                    <button type="button" onClick={() => setHypertension(0)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${hypertension === 0 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      No
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Heart Disease History</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setHeartDiseaseHx(1)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${heartDiseaseHx === 1 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Yes
                    </button>
                    <button type="button" onClick={() => setHeartDiseaseHx(0)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${heartDiseaseHx === 0 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Marital Status & Residence Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Marital Status</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEverMarried('Yes')}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${everMarried === 'Yes' ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Married
                    </button>
                    <button type="button" onClick={() => setEverMarried('No')}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${everMarried === 'No' ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Single
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Residence Type</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setResidenceType('Urban')}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${residenceType === 'Urban' ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Urban
                    </button>
                    <button type="button" onClick={() => setResidenceType('Rural')}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${residenceType === 'Rural' ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                      Rural
                    </button>
                  </div>
                </div>
              </div>

              {/* Work Type */}
              <div>
                <label className={labelCls}>Work Type</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select work type</option>
                  <option value="Private">Private</option>
                  <option value="Govt_job">Government Job</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Never_worked">Never Worked</option>
                  <option value="children">Children</option>
                </select>
              </div>

              {/* Smoking Status */}
              <div>
                <label className={labelCls}>Smoking Status</label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select smoking status</option>
                  <option value="never smoked">Never Smoked</option>
                  <option value="formerly smoked">Formerly Smoked</option>
                  <option value="smokes">Smokes</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              

              {/* Exercise Angina */}
              <div>
                <label className={labelCls}>Does pain worsen with physical activity?</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setExerciseAngina(1)}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${exerciseAngina === 1 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                    Yes
                  </button>
                  <button type="button" onClick={() => setExerciseAngina(0)}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${exerciseAngina === 0 ? 'border-mint bg-mint/10 text-mint' : 'border-gray-200 text-gray-600 hover:border-mint/40'}`}>
                    No
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Symptoms ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Your Symptoms <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {symptomList.map((s) => {
                const selected = selectedSymptoms.includes(s.symptom);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.symptom)}
                    className={`p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      selected
                        ? 'border-mint bg-mint/10'
                        : 'border-gray-200 hover:border-mint/40 bg-white'
                    }`}
                  >
                    <span className={selected ? 'text-mint' : 'text-gray-400'}>
                      {ICON_MAP[s.symptom] ?? <AlertCircle className="w-5 h-5" />}
                    </span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{s.symptom}</span>
                    {selected && <Check className="w-4 h-4 text-mint flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Duration ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    duration === opt.value
                      ? 'border-mint bg-mint/10 text-mint'
                      : 'border-gray-200 text-gray-600 hover:border-mint/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Severity ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    severity === opt.value
                      ? opt.active
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-blue to-mint hover:from-[#2563EB] hover:to-mint/90 text-white rounded-xl py-4 text-base font-semibold shadow-md transition-all"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Continue to Review →'}
          </Button>

        </div>
      </div>
    </div>
  );
};
