'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck, Eye, EyeOff, Loader2, X, UserPlus, ChevronRight,
  CheckCircle, ArrowLeft, ShieldCheck, AlertTriangle, RefreshCw,
  Edit3, Phone, Mail, User, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, visitorApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { EmployeeSearch } from '@/components/ui/EmployeeSearch';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecognizedVisitor {
  visitor_uid: string;
  name: string;
  phone: string;
  email: string;
  thumbnail?: string;
  distance: number;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-1.5 bg-crimson-600'
              : i < current
              ? 'w-1.5 h-1.5 bg-crimson-300'
              : 'w-1.5 h-1.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Back button ─────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors mb-4 group"
    >
      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      Back
    </button>
  );
}

// ─── Visitor floating modal ───────────────────────────────────────────────────
function VisitorModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'choose' | 'new' | 'returning' | 'done'>('choose');
  const [doneEmpName, setDoneEmpName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-crimson-100 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5 text-crimson-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Visitor Check-in</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {step === 'choose' && (
            <ChooseStep
              onNew={() => setStep('new')}
              onReturning={() => setStep('returning')}
            />
          )}
          {step === 'new' && (
            <NewVisitorForm
              onBack={() => setStep('choose')}
              onDone={(empName) => { setDoneEmpName(empName); setStep('done'); }}
            />
          )}
          {step === 'returning' && (
            <ReturningVisitorFlow
              onBack={() => setStep('choose')}
              onDone={(empName) => { setDoneEmpName(empName); setStep('done'); }}
              onSwitchToNew={() => setStep('new')}
            />
          )}
          {step === 'done' && (
            <DoneStep empName={doneEmpName} onClose={onClose} onAnother={() => setStep('choose')} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Choose step ─────────────────────────────────────────────────────────────
function ChooseStep({ onNew, onReturning }: { onNew: () => void; onReturning: () => void }) {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-1 text-center">
        Welcome! 👋
      </h2>
      <p className="text-gray-500 text-sm text-center mb-6">Have you visited us before?</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={onReturning}
          className="p-4 sm:p-5 rounded-2xl border-2 border-transparent bg-gray-50 hover:border-crimson-200 hover:bg-crimson-50 transition-all group text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-crimson-100 group-hover:bg-crimson-200 flex items-center justify-center mb-3 transition-colors">
            <UserCheck className="w-5 h-5 text-crimson-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">Returning Visitor</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Recognize me by face</p>
        </button>
        <button
          onClick={onNew}
          className="p-4 sm:p-5 rounded-2xl border-2 border-transparent bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-all group text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-3 transition-colors">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">New Visitor</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Register my details</p>
        </button>
      </div>
    </div>
  );
}

// ─── Done step ────────────────────────────────────────────────────────────────
function DoneStep({
  empName, onClose, onAnother,
}: {
  empName: string; onClose: () => void; onAnother: () => void;
}) {
  return (
    <div className="text-center py-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        You're Registered!
      </h2>
      <p className="text-gray-500 text-sm mb-1">
        Your visit request has been sent to{' '}
        <span className="font-semibold text-gray-700">{empName}</span>.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Please wait at reception while they review your request.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={onAnother} className="btn-secondary text-sm">
          Register Another
        </button>
        <button onClick={onClose} className="btn-primary text-sm">
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Returning Visitor — full multi-step flow ─────────────────────────────────
type ReturnStep =
  | 'capture'       // 1. Take/upload photo
  | 'confirm'       // 2. "Is this you?" confirmation
  | 'verify'        // 3. Enter old phone + email
  | 'wrong-creds'   // 4a. Credentials didn't match
  | 'action-choice' // 4b. Change details? or proceed?
  | 'update-details'// 5a. Update contact info form
  | 'select-employee'; // 5b/6. Choose employee + purpose

function ReturningVisitorFlow({
  onBack, onDone, onSwitchToNew,
}: {
  onBack: () => void;
  onDone: (empName: string) => void;
  onSwitchToNew: () => void;
}) {
  const [step, setStep] = useState<ReturnStep>('capture');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [recognized, setRecognized] = useState<RecognizedVisitor | null>(null);
  const [loading, setLoading] = useState(false);

  // Verify step
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Verified visitor data (may be updated)
  const [verifiedVisitor, setVerifiedVisitor] = useState<RecognizedVisitor | null>(null);

  // Update-details step
  const [newName, setNewName]   = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhoto, setNewPhoto] = useState<Blob | null>(null);
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  // Select-employee step
  const [empId, setEmpId]     = useState('');
  const [empName, setEmpName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [empError, setEmpError] = useState('');

  // ── Step 1: Recognize face ────────────────────────────────────────────────
  const recognizeFace = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', photo, 'query.jpg');
      fd.append('limit', '1');
      const { data } = await visitorApi.recognize(fd);
      if (data.matched?.length > 0) {
        setRecognized(data.matched[0]);
        setStep('confirm');
      } else {
        toast.error('Face not recognized. Please try again or register as a new visitor.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Recognition failed — try a clearer photo');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Verify identity ───────────────────────────────────────────────
  const verifyIdentity = async () => {
    if (!recognized) return;
    setVerifyError('');

    const phoneTrimmed = verifyPhone.trim().replace(/\s+/g, ' ');
    const emailTrimmed = verifyEmail.trim().toLowerCase();

    if (!phoneTrimmed || !emailTrimmed) {
      setVerifyError('Please enter both phone and email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await visitorApi.verifyIdentity(
        recognized.visitor_uid,
        phoneTrimmed,
        emailTrimmed,
      );
      if (data.verified) {
        setVerifiedVisitor({ ...recognized, phone: data.visitor.phone, email: data.visitor.email });
        setStep('action-choice');
      } else {
        // Surface specific field hint from BE debug info
        if (data.debug) {
          const { phone_match, email_match } = data.debug;
          if (!phone_match && !email_match) {
            setVerifyError('Both phone and email do not match our records');
          } else if (!phone_match) {
            setVerifyError('Phone number does not match — try without spaces or +91 prefix');
          } else if (!email_match) {
            setVerifyError('Email address does not match our records');
          }
        }
        setStep('wrong-creds');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5a: Update details ───────────────────────────────────────────────
  const submitUpdateDetails = async () => {
    if (!verifiedVisitor) return;
    const errs: Record<string, string> = {};
    if (!newName.trim() && !newPhone.trim() && !newEmail.trim() && !newPhoto) {
      errs.general = 'Please update at least one field';
    }
    if (Object.keys(errs).length) { setUpdateErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await visitorApi.updateDetails(verifiedVisitor.visitor_uid, {
        name:  newName.trim()  || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        photo: newPhoto        || undefined,
      });
      // Update in-memory visitor with new values
      setVerifiedVisitor(v => v ? {
        ...v,
        name:  data.name  || v.name,
        phone: data.phone || v.phone,
        email: data.email || v.email,
        thumbnail: data.thumbnail || v.thumbnail,
      } : v);
      toast.success('Details updated!');
      setStep('select-employee');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Final: Submit visit request ───────────────────────────────────────────
  const submitVisit = async () => {
    if (!verifiedVisitor || !photo) return;
    if (!empId) { setEmpError('Please select an employee to visit'); return; }
    setEmpError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name',                 verifiedVisitor.name);
      fd.append('phone',                verifiedVisitor.phone);
      fd.append('email',                verifiedVisitor.email);
      fd.append('employee_to_visit_id', empId);
      fd.append('purpose',              purpose);
      fd.append('photo',                newPhoto || photo, 'photo.jpg');
      await visitorApi.register(fd);
      onDone(empName);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const STEP_MAP: Record<ReturnStep, number> = {
    capture:          0,
    confirm:          1,
    verify:           2,
    'wrong-creds':    2,
    'action-choice':  3,
    'update-details': 4,
    'select-employee':4,
  };

  return (
    <div className="animate-fade-in">
      {/* Step dots */}
      <StepDots total={5} current={STEP_MAP[step]} />

      {/* ── STEP: capture ────────────────────────────────────────────── */}
      {step === 'capture' && (
        <div>
          <BackBtn onClick={onBack} />
          <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
            Welcome Back! 👋
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Take or upload a photo so we can recognize you.
          </p>
          <CameraCapture
            onCapture={(blob) => setPhoto(blob)}
            onClear={() => { setPhoto(null); setRecognized(null); }}
          />
          <button
            type="button"
            onClick={recognizeFace}
            disabled={!photo || loading}
            className="btn-primary w-full justify-center mt-4 py-3 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Recognizing…</>
              : <><UserCheck className="w-4 h-4" />Recognize Me</>}
          </button>
        </div>
      )}

      {/* ── STEP: confirm ────────────────────────────────────────────── */}
      {step === 'confirm' && recognized && (
        <div>
          <BackBtn onClick={() => setStep('capture')} />
          <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-1 text-center">
            Is this you?
          </h2>
          <p className="text-xs text-gray-500 text-center mb-5">
            We found a match. Please confirm your identity.
          </p>

          {/* Identity card */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              {recognized.thumbnail ? (
                <img
                  src={`data:image/jpeg;base64,${recognized.thumbnail}`}
                  alt={recognized.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-crimson-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-5xl font-bold text-crimson-600">
                    {recognized.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-xl mt-1">{recognized.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              Match confidence: {Math.round((1 - recognized.distance) * 100)}%
            </p>
          </div>

          {/* Yes / No */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep('verify')}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Yes, that's me
            </button>
            <button
              onClick={() => {
                setRecognized(null);
                setPhoto(null);
                setStep('capture');
                toast('Please try again with a clearer photo', { icon: '📷' });
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
              Not me
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            Not recognized?{' '}
            <button
              onClick={onSwitchToNew}
              className="text-crimson-600 font-medium hover:underline"
            >
              Register as new visitor
            </button>
          </p>
        </div>
      )}

      {/* ── STEP: verify ─────────────────────────────────────────────── */}
      {step === 'verify' && (
        <div>
          <BackBtn onClick={() => setStep('confirm')} />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                Verify Your Identity
              </h2>
              <p className="text-xs text-gray-500">
                Enter the phone &amp; email you registered with
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                Registered Phone
              </label>
              <input
                type="tel"
                className={`input text-sm py-2.5 ${verifyError?.includes('Phone') || (verifyError && !verifyPhone) ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="+91 9182928678"
                value={verifyPhone}
                onChange={e => { setVerifyPhone(e.target.value); setVerifyError(''); }}
                autoFocus
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Enter exactly as registered — with or without +91 prefix
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gray-400" />
                Registered Email
              </label>
              <input
                type="email"
                className={`input text-sm py-2.5 ${verifyError?.includes('mail') || (verifyError && !verifyEmail) ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="you@email.com"
                value={verifyEmail}
                onChange={e => { setVerifyEmail(e.target.value); setVerifyError(''); }}
              />
            </div>
            {verifyError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed">{verifyError}</p>
              </div>
            )}
          </div>

          <button
            onClick={verifyIdentity}
            disabled={loading}
            className="btn-primary w-full justify-center mt-5 py-3 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
              : <><ShieldCheck className="w-4 h-4" />Verify Identity</>}
          </button>
        </div>
      )}

      {/* ── STEP: wrong-creds ────────────────────────────────────────── */}
      {step === 'wrong-creds' && (
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-2">
            Details Don't Match
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            The details you entered don't match our records.
          </p>
          {verifyError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-left mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{verifyError}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mb-6">
            This could be a face match error, or the details you entered may differ from what was registered.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                setVerifyPhone('');
                setVerifyEmail('');
                setVerifyError('');
                setStep('verify');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry with correct details
            </button>
            <button
              onClick={() => {
                setStep('capture');
                setPhoto(null);
                setRecognized(null);
                setVerifyPhone('');
                setVerifyEmail('');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try a different photo
            </button>
            <button
              onClick={onSwitchToNew}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register as new visitor
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: action-choice ──────────────────────────────────────── */}
      {step === 'action-choice' && verifiedVisitor && (
        <div className="animate-fade-in">
          <BackBtn onClick={() => setStep('verify')} />

          {/* Verified banner */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl mb-5">
            {verifiedVisitor.thumbnail ? (
              <img
                src={`data:image/jpeg;base64,${verifiedVisitor.thumbnail}`}
                alt={verifiedVisitor.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-emerald-600">
                  {verifiedVisitor.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-700">Identity Verified</span>
              </div>
              <p className="font-bold text-gray-900 text-sm truncate">{verifiedVisitor.name}</p>
              <p className="text-xs text-gray-500 truncate">{verifiedVisitor.email}</p>
            </div>
          </div>

          <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
            How would you like to proceed?
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            You can update your contact details or go straight to selecting who you're visiting.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                // Pre-fill update form with current values
                setNewName(verifiedVisitor.name);
                setNewPhone(verifiedVisitor.phone);
                setNewEmail(verifiedVisitor.email);
                setStep('update-details');
              }}
              className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <Edit3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Update My Details</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Change name, phone, email, or photo — then select who you're visiting
                </p>
              </div>
            </button>

            <button
              onClick={() => setStep('select-employee')}
              className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-crimson-300 hover:bg-crimson-50 transition-all text-left group active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-xl bg-crimson-100 group-hover:bg-crimson-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <UserCheck className="w-4 h-4 text-crimson-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Details Are Correct</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Skip to selecting the employee you'd like to visit
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: update-details ─────────────────────────────────────── */}
      {step === 'update-details' && verifiedVisitor && (
        <div className="animate-fade-in">
          <BackBtn onClick={() => setStep('action-choice')} />
          <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
            Update Your Details
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Only changed fields will be saved.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3 text-gray-400" />
                Full Name
              </label>
              <input
                type="text"
                className="input text-sm py-2.5"
                placeholder={verifiedVisitor.name}
                value={newName}
                onChange={e => { setNewName(e.target.value); setUpdateErrors({}); }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                Phone Number
              </label>
              <input
                type="tel"
                className="input text-sm py-2.5"
                placeholder={verifiedVisitor.phone}
                value={newPhone}
                onChange={e => { setNewPhone(e.target.value); setUpdateErrors({}); }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                className="input text-sm py-2.5"
                placeholder={verifiedVisitor.email}
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setUpdateErrors({}); }}
              />
            </div>

            {/* New photo (optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Update Photo <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <CameraCapture
                onCapture={blob => setNewPhoto(blob)}
                onClear={() => setNewPhoto(null)}
              />
            </div>

            {updateErrors.general && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {updateErrors.general}
              </p>
            )}
          </div>

          <button
            onClick={submitUpdateDetails}
            disabled={loading}
            className="btn-primary w-full justify-center mt-5 py-3 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : <><CheckCircle className="w-4 h-4" />Save &amp; Continue</>}
          </button>
        </div>
      )}

      {/* ── STEP: select-employee ─────────────────────────────────────── */}
      {step === 'select-employee' && verifiedVisitor && (
        <div className="animate-fade-in">
          <BackBtn onClick={() => setStep('action-choice')} />

          {/* Visitor summary chip */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-5">
            {(newPhoto
              ? null  // If they updated with a new photo, show placeholder until re-recognized
              : verifiedVisitor.thumbnail) ? (
              <img
                src={`data:image/jpeg;base64,${verifiedVisitor.thumbnail}`}
                alt=""
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-crimson-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-crimson-600">
                  {verifiedVisitor.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{verifiedVisitor.name}</p>
              <p className="text-xs text-gray-400 truncate">{verifiedVisitor.email}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>

          <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
            Who are you visiting?
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Search for the employee by name or ID.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Employee to Visit <span className="text-crimson-500">*</span>
              </label>
              <EmployeeSearch
                value={empId}
                onChange={(id, name) => { setEmpId(id); setEmpName(name); setEmpError(''); }}
                error={empError}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Purpose of Visit
              </label>
              <input
                type="text"
                className="input text-sm py-2.5"
                placeholder="Meeting, Interview, Delivery…"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={submitVisit}
            disabled={loading || !empId}
            className="btn-primary w-full justify-center mt-5 py-3 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
              : <><CheckCircle className="w-4 h-4" />Submit Visit Request</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── New visitor form ─────────────────────────────────────────────────────────
function NewVisitorForm({ onBack, onDone }: { onBack: () => void; onDone: (empName: string) => void }) {
  const [photo, setPhoto]     = useState<Blob | null>(null);
  const [form, setForm]       = useState({ name: '', phone: '', email: '', purpose: '' });
  const [empId, setEmpId]     = useState('');
  const [empName, setEmpName] = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photo)      e.photo = 'Photo is required';
    if (!form.name)  e.name  = 'Required';
    if (!form.phone) e.phone = 'Required';
    if (!form.email) e.email = 'Required';
    if (!empId)      e.emp   = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('phone', form.phone);
      fd.append('email', form.email); fd.append('purpose', form.purpose);
      fd.append('employee_to_visit_id', empId);
      fd.append('photo', photo!, 'photo.jpg');
      await visitorApi.register(fd);
      onDone(empName);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed — check your photo');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="animate-fade-in">
      <BackBtn onClick={onBack} />
      <h2 className="font-display font-bold text-gray-900 text-base sm:text-lg mb-4">
        New Visitor Registration
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Camera */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Step 1 — Photo <span className="text-crimson-500">*</span>
          </p>
          <CameraCapture
            onCapture={(blob) => { setPhoto(blob); setErrors((e) => ({ ...e, photo: '' })); }}
            onClear={() => setPhoto(null)}
          />
          {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Step 2 — Details
          </p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
            <input
              className={`input text-sm py-2 ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Ravi Shankar" value={form.name} onChange={set('name')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone *</label>
            <input
              className={`input text-sm py-2 ${errors.phone ? 'border-red-400' : ''}`}
              placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={set('phone')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              className={`input text-sm py-2 ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@email.com" type="email" value={form.email} onChange={set('email')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Employee to Visit *</label>
            <EmployeeSearch
              value={empId}
              onChange={(id, name) => { setEmpId(id); setEmpName(name); setErrors((e) => ({ ...e, emp: '' })); }}
              error={errors.emp}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purpose</label>
            <input className="input text-sm py-2" placeholder="Meeting, Interview…"
              value={form.purpose} onChange={set('purpose')} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5 py-3">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Registering…' : 'Submit Visit Request'}
      </button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [card, setCard]               = useState<'signin' | 'signup'>('signin');
  const [showVisitor, setShowVisitor] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {showVisitor && <VisitorModal onClose={() => setShowVisitor(false)} />}

      {/* Top nav */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-end">
        <button onClick={() => setShowVisitor(true)} className="btn-primary shadow-red text-sm">
          <UserCheck className="w-4 h-4" />
          I'm a Visitor
        </button>
      </header>

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Left — hero */}
        <div className="relative lg:w-3/5 flex-shrink-0 min-h-[45vh] lg:min-h-screen overflow-hidden bg-white">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url('/vms-hero.png')", opacity: 0.15 }}
          />
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-gray-50 hidden lg:block" />
          <div className="relative z-10 flex items-center justify-center lg:justify-start h-full pt-24 lg:pt-0 pb-10 lg:pb-0 px-10 lg:px-16">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-50 border border-crimson-100 text-crimson-700 text-xs font-semibold tracking-wide mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />
                Face Recognition Powered
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Visitor Management,{' '}
                <span className="text-crimson-700">Reimagined.</span>
              </h1>
              <p className="text-gray-500 mt-4 text-base leading-relaxed">
                Register visitors with face recognition, get instant employee notifications, and manage approvals — all in one professional platform.
              </p>
            </div>
          </div>
        </div>

        {/* Right — employee card */}
        <div className="lg:w-2/5 flex items-center justify-center px-6 py-16 lg:py-0 bg-gray-50">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="card shadow-card-lg">
              <div className="flex items-center justify-center mb-5">
                <img src="/logo.png" alt="Logo" style={{ height: '70px', width: '260px' }} />
              </div>

              {/* Toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
                <button
                  onClick={() => setCard('signin')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    card === 'signin' ? 'bg-white text-crimson-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCard('signup')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    card === 'signup' ? 'bg-white text-crimson-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {card === 'signin' ? <SignInForm /> : <SignUpForm onDone={() => setCard('signin')} />}

              <div className="flex items-center justify-center mt-6 pt-2">
                <img src="/facegenie_logo.png" alt="Logo" style={{ height: '60px', width: '220px' }} />
              </div>
            </div>

            <p className="text-center mt-4 text-sm text-gray-400">
              Visiting someone?{' '}
              <button
                onClick={() => setShowVisitor(true)}
                className="text-crimson-600 font-medium hover:text-crimson-700"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sign In ───────────────────────────────────────────────────────────────────
function SignInForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('vms_token', data.access_token);
      localStorage.setItem('vms_employee', JSON.stringify(data.employee));
      login(data.access_token, data.employee);
      toast.success(`Welcome back, ${data.employee.name}!`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          Email
        </label>
        <input
          type="email" className="input text-sm py-2" placeholder="you@company.com"
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} className="input text-sm py-2 pr-10"
            placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
          />
          <button
            type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary justify-center py-2.5 mt-1">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
function SignUpForm({ onDone }: { onDone: () => void }) {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !password) { toast.error('Please fill all required fields'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6)  { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.register({ name, email, employee_id: employeeId.toUpperCase(), department, password });
      toast.success('Account created! Please sign in.');
      onDone();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
          <input type="text" className="input text-sm py-2" placeholder="Nedhunuri Tarun"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Email *</label>
          <input type="email" className="input text-sm py-2" placeholder="tarun@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Employee ID *</label>
          <input type="text" className="input text-sm py-2 uppercase" placeholder="R098"
            value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Department</label>
          <input type="text" className="input text-sm py-2" placeholder="Engineering"
            value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Password *</label>
          <input type="password" className="input text-sm py-2" placeholder="Min. 6 chars"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Confirm *</label>
          <input type="password" className="input text-sm py-2" placeholder="Repeat"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary justify-center py-2.5 mt-1">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Creating…' : 'Create Account'}
      </button>
    </form>
  );
}