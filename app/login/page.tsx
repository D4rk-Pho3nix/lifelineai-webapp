"use client"

import { useState, useRef, useEffect } from "react"
import { Eye, EyeOff, ChevronDown, Loader2, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { supabase } from "@/src/supabaseClient"
import bcrypt from "bcryptjs"

export default function LoginPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const [authMode, setAuthMode] = useState("user")
  const [authView, setAuthView] = useState("login")
  const [showOTP, setShowOTP] = useState(false)
  const [showPasswordCreate, setShowPasswordCreate] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  
  // Firebase Auth State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpShake, setOtpShake] = useState(false);
  const [otpWrong, setOtpWrong] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [firebaseError, setFirebaseError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifierRef = useRef<any>(null);
  const otpDigitRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [isFaculty, setIsFaculty] = useState<boolean | null>(null)
  
  // User Sign Up state
  const [isStudent, setIsStudent] = useState<boolean | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // Admin Sign Up extra state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [facultyId, setFacultyId] = useState("")
  
  // Admin field errors
  const [firstNameFieldError, setFirstNameFieldError] = useState(false)
  const [firstNameFieldShake, setFirstNameFieldShake] = useState(false)
  const [institutionFieldError, setInstitutionFieldError] = useState(false)
  const [institutionFieldShake, setInstitutionFieldShake] = useState(false)
  const [emailFieldError, setEmailFieldError] = useState(false)
  const [emailFieldShake, setEmailFieldShake] = useState(false)
  
  // User Restriction Modal State
  const [showUserRestriction, setShowUserRestriction] = useState(false)
  
  // Validation Error State
  const [validationError, setValidationError] = useState("")
  
  // Institution Combobox State
  const [institution, setInstitution] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [institutions, setInstitutions] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  
  const [showForgotCountryDropdown, setShowForgotCountryDropdown] = useState(false)
  const forgotCountryDropdownRef = useRef<HTMLDivElement>(null)

  const COUNTRY_CODES = [
    { code: "+91", label: "IN (+91)" },
    { code: "+1", label: "US (+1)" },
    { code: "+44", label: "UK (+44)" },
    { code: "+61", label: "AU (+61)" },
    { code: "+49", label: "DE (+49)" },
    { code: "+33", label: "FR (+33)" },
    { code: "+81", label: "JP (+81)" },
    { code: "+86", label: "CN (+86)" },
    { code: "+55", label: "BR (+55)" },
    { code: "+7", label: "RU (+7)" },
    { code: "+27", label: "ZA (+27)" },
    { code: "+82", label: "KR (+82)" },
    { code: "+39", label: "IT (+39)" },
    { code: "+34", label: "ES (+34)" },
    { code: "+31", label: "NL (+31)" }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
      if (forgotCountryDropdownRef.current && !forgotCountryDropdownRef.current.contains(event.target as Node)) {
        setShowForgotCountryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Always destroy old container + widget and create a fresh one
  const createFreshRecaptcha = (): any => {
    // Clear old verifier
    if ((window as any).recaptchaVerifier) {
      try { (window as any).recaptchaVerifier.clear(); } catch {}
      (window as any).recaptchaVerifier = null;
    }
    // Remove old container element from DOM entirely
    const oldEl = document.getElementById('recaptcha-dynamic-container');
    if (oldEl) oldEl.remove();
    // Create a brand-new container
    const el = document.createElement('div');
    el.id = 'recaptcha-dynamic-container';
    el.style.display = 'none';
    document.body.appendChild(el);
    // Build fresh verifier
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-dynamic-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {},
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  // Async Real-Time API Search
  useEffect(() => {
    if (!searchTerm || institution === searchTerm) {
      setInstitutions([])
      return
    }

    const fetchInstitutions = async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/institutions?search=${encodeURIComponent(searchTerm)}`)
        const data = await res.json()
        setInstitutions(data || [])
      } catch (error) {
        console.error("Failed to fetch institutions")
        setInstitutions([])
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(fetchInstitutions, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [searchTerm, institution])

  const [countryCode, setCountryCode] = useState("+91")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [phoneFieldError, setPhoneFieldError] = useState(false)
  const [passwordFieldError, setPasswordFieldError] = useState(false)
  const [phoneFieldShake, setPhoneFieldShake] = useState(false)
  const [passwordFieldShake, setPasswordFieldShake] = useState(false)
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false)

  const getDigitsPhone = () => phoneNumber.replace(/\D/g, "")
  const getFullPhone = () => `${countryCode}${getDigitsPhone()}`

  const triggerFieldError = (field: "phone" | "password", message: string) => {
    setFirebaseError(message)
    if (field === "phone") {
      setPhoneFieldError(true)
      setPhoneFieldShake(true)
      setTimeout(() => {
        setPhoneFieldShake(false)
        setPhoneFieldError(false)
      }, 500)
      return
    }
    setPasswordFieldError(true)
    setPasswordFieldShake(true)
    setTimeout(() => {
      setPasswordFieldShake(false)
      setPasswordFieldError(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setFirebaseError('');
    const fullPhone = getFullPhone()

    if (!otpSent) {
      try {
        // Task 1: validate credentials in Supabase BEFORE sending OTP
        const { data: row, error } = await supabase
          .from("website_user_details")
          .select("phone_number,password")
          .eq("phone_number", getDigitsPhone())
          .maybeSingle()
        if (error) throw error

        if (!row) {
          triggerFieldError("phone", "Phone number not registered.")
          setIsLoading(false)
          return
        }

        const ok = await bcrypt.compare(password, (row as any).password || "")
        if (!ok) {
          triggerFieldError("password", "Incorrect password. Please try again.")
          setIsLoading(false)
          return
        }

        const appVerifier = createFreshRecaptcha();
        const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpDigitRefs[0]?.current?.focus(), 100);
      } catch (err: any) {
        setFirebaseError(err.message || 'Failed to send OTP. Verify your number and try again.');
      }
    } else {
      const entered = otpDigits.join('');
      try {
        await confirmationResult.confirm(entered);
        router.push('/');
      } catch (err: any) {
        setOtpWrong(true);
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        setFirebaseError('Invalid OTP. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setFirebaseError('');
    const fullPhone = getFullPhone()

    if (!otpSent) {
      try {
        const appVerifier = createFreshRecaptcha();
        const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpDigitRefs[0]?.current?.focus(), 100);
      } catch (err: any) {
        setFirebaseError(err.message || 'Failed to send OTP.');
      }
    } else {
      const entered = otpDigits.join('');
      try {
        const userCredential = await confirmationResult.confirm(entered);
        const user = userCredential.user;
        
        // Save user to Supabase after successful OTP verification
        setOtpSent(false);
        setShowOTP(false);
        setShowPasswordCreate(true);
      } catch (err: any) {
        setOtpWrong(true);
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        setFirebaseError('Invalid OTP. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleAdminSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setFirebaseError('');
    const fullPhone = getFullPhone()

    if (!otpSent) {
      try {
        const phoneDigits = getDigitsPhone();
        
        // First check if this phone number belongs to a regular user
        const { data: userRow, error: userFetchError } = await supabase
          .from('website_user_details')
          .select('phone_number')
          .eq('phone_number', phoneDigits)
          .maybeSingle();
        
        if (userFetchError && userFetchError.code !== 'PGRST116') throw userFetchError;
        
        // If phone number exists in user table, show restriction warning
        if (userRow) {
          setShowUserRestriction(true);
          setIsLoading(false);
          return;
        }
        
        // Check admin credentials in Supabase BEFORE sending OTP
        const { data: row, error } = await supabase
          .from("website_admin_details")
          .select("phone_number,password_hash")
          .eq("phone_number", phoneDigits)
          .maybeSingle()
        if (error) throw error

        if (!row) {
          triggerFieldError("phone", "Phone number not registered.")
          setIsLoading(false)
          return
        }

        const ok = await bcrypt.compare(password, (row as any).password_hash || "")
        if (!ok) {
          triggerFieldError("password", "Incorrect password. Please try again.")
          setIsLoading(false)
          return
        }

        const appVerifier = createFreshRecaptcha();
        const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpDigitRefs[0]?.current?.focus(), 100);
      } catch (err: any) {
        setFirebaseError(err.message || 'Failed to send OTP. Verify your number and try again.');
      }
    } else {
      const entered = otpDigits.join('');
      try {
        await confirmationResult.confirm(entered);
        router.push('/admin');
      } catch (err: any) {
        setOtpWrong(true);
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        setFirebaseError('Invalid OTP. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleAdminSignUp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setFirebaseError('');
    const fullPhone = getFullPhone()

    if (!otpSent) {
      try {
        const appVerifier = createFreshRecaptcha();
        const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpDigitRefs[0]?.current?.focus(), 100);
      } catch (err: any) {
        setFirebaseError(err.message || 'Failed to send OTP.');
      }
    } else {
      const entered = otpDigits.join('');
      try {
        const userCredential = await confirmationResult.confirm(entered);
        const user = userCredential.user;
        
        // OTP verified - navigate to password creation screen
        setOtpSent(false);
        setShowOTP(false);
        setShowPasswordCreate(true);
      } catch (err: any) {
        setOtpWrong(true);
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        setFirebaseError('Invalid OTP. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handlePreSubmit = () => {
    setValidationError("")
    
    // Login Validation (User & Admin)
    if (authView === "login") {
      if (!phoneNumber) return setValidationError("Phone number is required.")
      if (authMode === "user" && !password) return setValidationError("Password is required.")
      if (authMode === "admin" && !password) return setValidationError("Password is required.")
    }
    
    // User Sign Up Validation
    if (authMode === "user" && authView === "user-signup") {
      if (!phoneNumber) return setValidationError("Phone number is required.")
      if (isStudent === null) return setValidationError("Please specify if you are a college student.")
    }

    // Admin Sign Up Validation
    if (authMode === "admin" && authView === "admin-signup") {
      if (!firstName) {
        setFirstNameFieldError(true);
        setFirstNameFieldShake(true);
        setTimeout(() => {
          setFirstNameFieldShake(false);
          setFirstNameFieldError(false);
        }, 500);
        return setValidationError("First Name is required.");
      }
      if (!phoneNumber) {
        triggerFieldError("phone", "Phone number is required.");
        return;
      }
      if (isFaculty === null) {
        return setValidationError("Please specify if you are a faculty.");
      }
      if (isFaculty) {
        if (!institution) {
          setInstitutionFieldError(true);
          setInstitutionFieldShake(true);
          setTimeout(() => {
            setInstitutionFieldShake(false);
            setInstitutionFieldError(false);
          }, 500);
          return setValidationError("Institution is required.");
        }
        if (!email) {
          setEmailFieldError(true);
          setEmailFieldShake(true);
          setTimeout(() => {
            setEmailFieldShake(false);
            setEmailFieldError(false);
          }, 500);
          return setValidationError("Email ID is required.");
        }
      }
    }

    // Routing to specific handle
    if (authMode === "user") {
      if (authView === "login") handleSignIn();
      else handleSignUp();
    } else {
      if (authView === "login") handleAdminSignIn();
      else handleAdminSignUp();
    }
  }

  const getPasswordStrength = () => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    
    if (newPassword.length === 0) return { color: "bg-gray-600", text: "", allowConfirm: false, width: "0%" };
    if (score < 2) return { color: "bg-red-500", text: "Weak: Use 8+ chars and mixed cases", allowConfirm: false, width: "33%" };
    if (score === 2 || score === 3) return { color: "bg-yellow-500", text: "Medium: Add numbers or special characters", allowConfirm: true, width: "66%" };
    return { color: "bg-green-500", text: "Strong: Excellent", allowConfirm: true, width: "100%" };
  }
  const pwdData = getPasswordStrength();

  return (
    <>
    {/* User Restriction Modal */}
    {showUserRestriction && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
        <div
          className="w-full max-w-md rounded-2xl p-8 relative animate-modal-slide-up"
          style={{
            background: '#1a1d24',
            border: '1px solid rgba(245,158,11,0.4)',
            boxShadow: '0 8px 32px rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)' }}>
              <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Access Restricted</h2>
            <p className="text-sm mb-6" style={{ color: '#9ca3af', lineHeight: '1.6' }}>
              This phone number is registered as a regular user account. User credentials are not allowed to access the admin portal.
            </p>
            <button
              type="button"
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{ background: '#f59e0b' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d97706'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f59e0b'; }}
              onClick={() => {
                setShowUserRestriction(false);
                setPhoneNumber('');
                setPassword('');
                setFirebaseError('');
                setValidationError('');
              }}
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    )}
    
    <div className={`min-h-screen grid grid-rows-[auto_1fr] bg-[#1e1e1e] text-white font-sans transition-opacity duration-500 ${isNavigating ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <style>{`
        @keyframes modalSlideUp {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-slide-up {
          animation: modalSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes formSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-form {
          animation: formSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes fastFadeIn {
          0% { opacity: 0; filter: blur(2px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .animate-fast-fade {
          animation: fastFadeIn 0.8s ease-out forwards;
        }
        @keyframes otpShakeAnim {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .otp-shake { animation: otpShakeAnim 0.6s ease-out; }
        .field-shake { animation: otpShakeAnim 0.5s ease-out; }
        @keyframes otpFadeIn {
          0% { opacity: 0; transform: scale(0.93) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .otp-screen-enter { animation: otpFadeIn 0.45s cubic-bezier(0.2,0.8,0.2,1) forwards; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 60px #1e1e1e inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
          transition: background-color 9999s ease-in-out 0s !important;
        }
      `}</style>

      {/* ─── Full-Screen OTP Verification Screen ─── */}
      {otpSent && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1e1e1e]">
          <div className="otp-screen-enter w-full max-w-[420px] px-6 flex flex-col items-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-[#04895f]/15 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#04895f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-[26px] font-bold text-white mb-2 tracking-tight">Verify your number</h1>
            <p className="text-white/50 text-[14px] text-center mb-8">
              A 6-digit code was sent to <span className="text-white/80 font-medium">+91 {phoneNumber}</span>
            </p>

            {/* 6 Digit Inputs */}
            <div className={`flex gap-3 mb-4 ${otpShake ? 'otp-shake' : ''}`}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpDigitRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className={`w-12 h-14 text-center text-[22px] font-bold rounded-[10px] outline-none transition-all duration-150
                    ${otpWrong
                      ? 'bg-red-500/10 border-2 border-red-500 text-red-400'
                      : digit
                        ? 'bg-[#2d2d2d] border-2 border-[#04895f] text-white'
                        : 'bg-[#2d2d2d] border-2 border-white/10 text-white focus:border-[#04895f]'
                    }`}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                    const newDigits = [...otpDigits];
                    newDigits[idx] = val;
                    setOtpDigits(newDigits);
                    setOtpWrong(false);
                    setFirebaseError('');
                    if (val && idx < 5) {
                      otpDigitRefs[idx + 1]?.current?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (!digit && idx > 0) {
                        const newDigits = [...otpDigits];
                        newDigits[idx - 1] = '';
                        setOtpDigits(newDigits);
                        otpDigitRefs[idx - 1]?.current?.focus();
                      } else {
                        const newDigits = [...otpDigits];
                        newDigits[idx] = '';
                        setOtpDigits(newDigits);
                      }
                    }
                    if (e.key === 'Enter' && otpDigits.join('').length === 6) {
                      authMode === 'user' ? (authView === 'login' ? handleSignIn() : handleSignUp()) : handleAdminSignIn();
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                    if (pasted.length === 6) {
                      const arr = pasted.split('');
                      setOtpDigits(arr);
                      setOtpWrong(false);
                      otpDigitRefs[5]?.current?.focus();
                    }
                    e.preventDefault();
                  }}
                />
              ))}
            </div>

            {/* Error message */}
            {(firebaseError || otpWrong) && (
              <p className="text-red-400 text-[13px] mb-4 text-center animate-fast-fade">
                {firebaseError || 'Incorrect code. Try again.'}
              </p>
            )}

            {/* Verify Button */}
            <button
              type="button"
              disabled={otpDigits.join('').length < 6 || isLoading}
              onClick={() => authMode === 'user' ? (authView === 'login' ? handleSignIn() : handleSignUp()) : handleAdminSignIn()}
              className="w-full py-[14px] bg-[#04895f] hover:bg-[#036b4a] transition-colors text-white rounded-[12px] font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Code'}
            </button>

            {/* Resend + Back */}
            <div className="flex items-center gap-4 text-[13px]">
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpWrong(false);
                  setFirebaseError('');
                  const fullPhone = getFullPhone()
                  try {
                    const appVerifier = createFreshRecaptcha();
                    const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
                    setConfirmationResult(result);
                    setOtpSent(true);
                    setTimeout(() => otpDigitRefs[0]?.current?.focus(), 100);
                  } catch (err: any) {
                    setFirebaseError(err.message || 'Failed to resend OTP.');
                    setOtpSent(true);
                  }
                }}
                className="text-[#04895f] hover:text-white transition-colors font-medium disabled:opacity-40"
              >
                Resend OTP
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpDigits(['','','','','','']); setOtpWrong(false); setFirebaseError(''); }}
                className="text-white/40 hover:text-white transition-colors"
              >
                Change number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center px-[48px] py-[24px]">
        {/* Logo Section */}
        <div className="flex items-center gap-[10px]">
          <Image
            src="/assets/logo.png"
            alt="Lifeline-AI Logo"
            width={32}
            height={32}
            className="w-[32px] h-[32px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-semibold text-[18px] tracking-[0.3px] text-white">
            Lifeline-AI
          </span>
        </div>

        {/* Navigation Button Group */}
        <div className="flex gap-[12px]">
          <button
            type="button"
            className="bg-[#04895f] text-white rounded-lg px-4 py-2 font-medium text-[14px] hover:bg-[#036b4a] transition-colors"
            onClick={() => {
              setAuthMode(authMode === "user" ? "admin" : "user")
              setAuthView("login")
              setValidationError("")
            }}
          >
            <span key={authMode} className="animate-fast-fade inline-block">
              {authMode === "user" ? "Admin Login" : "User Login"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grid place-items-center h-full">
        {/* Authentication Card */}
        <div
          className="w-[420px] p-[40px] rounded-[16px] bg-[#2d2d2d] border border-white/5"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
        >
          <h1 key={authMode + authView} className="text-[28px] font-bold text-white mb-[24px] text-center animate-fast-fade">
            {authMode === "user" ? (authView === "user-signup" ? "User Sign Up" : "User Login") : (authView === "admin-signup" ? "Admin Sign Up" : "Admin Login")}
          </h1>
          {authMode === "admin" && (
            <div className="relative border border-white/10 rounded-full p-1 mb-[24px] bg-[#1e1e1e] animate-fast-fade">
              <div className="absolute inset-1 flex">
                <div
                  className={`w-1/2 bg-[#2d2d2d] rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    authView === "login" ? "translate-x-0" : "translate-x-full"
                  }`}
                />
              </div>
              <div className="relative flex">
                <button
                  type="button"
                  className={`flex-1 flex justify-center py-2 text-sm font-medium rounded-full transition-colors duration-300 ${authView === "login" ? "text-white" : "text-white/50 hover:text-white"}`}
                  onClick={() => { setAuthView("login"); setValidationError("") }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`flex-1 flex justify-center py-2 text-sm font-medium rounded-full transition-colors duration-300 ${authView === "admin-signup" ? "text-white" : "text-white/50 hover:text-white"}`}
                  onClick={() => { setAuthView("admin-signup"); setValidationError("") }}
                >
                  Sign up
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div key={authMode + authView} className="animate-fast-fade">
              {authMode === "admin" && authView === "admin-signup" && (
                <div className="flex gap-3 mb-[16px]">
                  <div className="flex-1">
                    <label className="block text-[14px] font-medium text-white/90 mb-[6px]">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full p-[12px] bg-[#1e1e1e] border text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors ${firstNameFieldShake ? 'field-shake' : ''} ${firstNameFieldError ? 'border-red-500' : 'border-white/10'}`}
                      value={firstName} 
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setValidationError("");
                        setFirstNameFieldError(false);
                        setFirstNameFieldShake(false);
                      }} 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[14px] font-medium text-white/90 mb-[6px]">Last Name</label>
                    <input type="text" placeholder="(optional)" className="w-full p-[12px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Phone Number Input Group */}
              <div className="mb-[16px]">
                <label className="block text-sm font-medium text-white/90 mb-[6px]">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-[10px]">
                  <div className="relative" ref={countryDropdownRef}>
                    <div 
                      className="bg-[#1e1e1e] text-white py-[12px] pl-[14px] pr-[32px] rounded-[8px] border border-white/10 text-[14px] cursor-pointer h-full flex items-center hover:border-[#04895f] transition-colors min-w-[100px]"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    >
                      {COUNTRY_CODES.find(c => c.code === countryCode)?.label || countryCode}
                      <ChevronDown className={`absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 transition-transform duration-300 ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </div>
                    
                    <div className={`absolute z-20 w-[140px] left-0 bg-[#2d2d2d] border border-white/10 rounded-lg mt-2 max-h-60 overflow-y-auto shadow-xl transition-all duration-300 origin-top-left ${showCountryDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                      {COUNTRY_CODES.map((country) => (
                        <div
                          key={country.code}
                          className="px-4 py-3 hover:bg-[#04895f] hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 text-[13px]"
                          onClick={() => {
                            setCountryCode(country.code)
                            setShowCountryDropdown(false)
                          }}
                        >
                          {country.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <input
                    type="tel"
                    autoComplete="off"
                    placeholder={(authView === "user-signup" && otpSent) ? 'Enter 6-digit OTP' : 'Enter your number'}
                    className={`flex-1 p-[12px] bg-[#1e1e1e] border border-white/10 text-white placeholder:text-white/30 rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors ${phoneFieldShake ? 'field-shake' : ''} ${phoneFieldError ? 'border-red-500' : ''}`}
                    value={(authView === "user-signup" && otpSent) ? otpCode : phoneNumber}
                    onChange={(authView === "user-signup" && otpSent)
                      ? (e) => { setOtpCode(e.target.value); setFirebaseError(""); setPhoneFieldError(false); setPhoneFieldShake(false) }
                      : (e) => { setPhoneNumber(e.target.value.replace(/[^0-9]/g, "")); setFirebaseError(""); setPhoneFieldError(false); setPhoneFieldShake(false) }
                    }
                  />
                </div>
              </div>

              {authMode === "user" && authView === "user-signup" ? (
                <div className="mb-[24px]">
                  <label className="block text-[14px] font-medium text-white/90 mb-[8px]">
                    Are you a college student?
                  </label>
                  <div className="flex gap-4 mb-[16px]">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isStudent === true ? 'border-[#04895f] bg-[#04895f]' : 'border-white/30 group-hover:border-[#04895f]'}`}>
                        {isStudent === true && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-white/80 select-none">Yes</span>
                      <input type="radio" className="hidden" onChange={() => setIsStudent(true)} checked={isStudent === true} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isStudent === false ? 'border-[#04895f] bg-[#04895f]' : 'border-white/30 group-hover:border-[#04895f]'}`}>
                        {isStudent === false && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-white/80 select-none">No</span>
                      <input type="radio" className="hidden" onChange={() => setIsStudent(false)} checked={isStudent === false} />
                    </label>
                  </div>
                  
                  {isStudent === true && (
                    <div className="mb-[16px]">
                      <label className="block text-[14px] font-medium text-white/90 mb-[6px]">
                        Institution <span className="text-white/50">(optional)</span>
                      </label>
                      <div className="relative" ref={dropdownRef}>
                        <input 
                          type="text" 
                          className="w-full p-[12px] bg-[#1e1e1e] border border-white/10 text-white placeholder:text-white/30 rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors cursor-text pr-10" 
                          placeholder="Search institution..." 
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setShowDropdown(true)
                          }}
                          onFocus={() => setShowDropdown(true)}
                        />
                        <ChevronDown className="absolute right-[12px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                        
                        {showDropdown && searchTerm && searchTerm !== institution && (
                          <div className="absolute z-10 w-full left-0 bg-[#2d2d2d] border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
                            {isSearching ? (
                              <div className="px-4 py-8 flex justify-center text-white/70">
                                <Loader2 className="w-5 h-5 animate-spin" />
                              </div>
                            ) : institutions.length > 0 ? (
                              institutions.map((college, idx) => {
                                const validLocations = [college.district, college.state]
                                  .filter(part => part && !part.toLowerCase().includes('unknown'));
                                const locationString = validLocations.length > 0 ? validLocations.join(", ") : "";
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      const fullName = locationString ? `${college.name}, ${locationString}` : college.name;
                                      setInstitution(fullName);
                                      setSearchTerm(fullName);
                                      setShowDropdown(false);
                                    }}
                                    className="px-4 py-3 hover:bg-[#04895f] hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                  >
                                    <div className="text-[14px] font-medium text-white/90">{college.name}</div>
                                    {locationString && (
                                      <div className="text-[12px] text-white/50 mt-[2px]">
                                        {locationString}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div
                                onClick={() => {
                                  setInstitution('Other');
                                  setSearchTerm('Other');
                                  setShowDropdown(false);
                                }}
                                className="px-4 py-3 hover:bg-[#04895f] hover:text-white text-[14px] text-white/90 cursor-pointer transition-colors"
                              >
                                {searchTerm} (Other)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : authMode === "admin" && authView === "admin-signup" ? (
                <>
                  <div className="mb-[24px]">
                    <label className="block text-[14px] font-medium text-white/90 mb-[8px]">
                      Are you a faculty?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isFaculty === true ? 'border-[#04895f] bg-[#04895f]' : 'border-white/30 group-hover:border-[#04895f]'}`}>
                          {isFaculty === true && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-white/80 select-none">Yes</span>
                        <input
                          type="radio"
                          name="isFaculty"
                          value="yes"
                          className="hidden"
                          onChange={() => setIsFaculty(true)}
                          checked={isFaculty === true}
                        />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isFaculty === false ? 'border-[#04895f] bg-[#04895f]' : 'border-white/30 group-hover:border-[#04895f]'}`}>
                          {isFaculty === false && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-white/80 select-none">No</span>
                        <input
                          type="radio"
                          name="isFaculty"
                          value="no"
                          className="hidden"
                          onChange={() => setIsFaculty(false)}
                          checked={isFaculty === false}
                        />
                      </label>
                    </div>
                  </div>

                  {isFaculty === true && (
                    <>
                      <div className="mb-[16px]" ref={dropdownRef}>
                      <label className="block text-[14px] font-medium text-white/90 mb-[6px]">
                        Institution <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={`w-full p-[12px] bg-[#1e1e1e] border text-white placeholder:text-white/30 rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors cursor-text pr-10 ${institutionFieldShake ? 'field-shake' : ''} ${institutionFieldError ? 'border-red-500' : 'border-white/10'}`}
                          placeholder="Search institution..." 
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setShowDropdown(true)
                            setValidationError("");
                            setInstitutionFieldError(false);
                            setInstitutionFieldShake(false);
                          }}
                          onFocus={() => setShowDropdown(true)}
                        />
                        <ChevronDown className="absolute right-[12px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                        
                        {showDropdown && searchTerm && searchTerm !== institution && (
                          <div className="absolute z-10 w-full left-0 bg-[#2d2d2d] border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
                            {isSearching ? (
                              <div className="px-4 py-8 flex justify-center text-white/70">
                                <Loader2 className="w-5 h-5 animate-spin" />
                              </div>
                            ) : institutions.length > 0 ? (
                              institutions.map((college, idx) => {
                                const validLocations = [college.district, college.state]
                                  .filter(part => part && !part.toLowerCase().includes('unknown'));
                                const locationString = validLocations.length > 0 ? validLocations.join(", ") : "";
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      const fullName = locationString ? `${college.name}, ${locationString}` : college.name;
                                      setInstitution(fullName);
                                      setSearchTerm(fullName);
                                      setShowDropdown(false);
                                    }}
                                    className="px-4 py-3 hover:bg-[#04895f] hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                  >
                                    <div className="text-[14px] font-medium text-white/90">{college.name}</div>
                                    {locationString && (
                                      <div className="text-[12px] text-white/50 mt-[2px]">
                                        {locationString}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div
                                onClick={() => {
                                  setInstitution('Other');
                                  setSearchTerm('Other');
                                  setShowDropdown(false);
                                }}
                                className="px-4 py-3 hover:bg-[#04895f] hover:text-white text-[14px] text-white/90 cursor-pointer transition-colors"
                              >
                                {searchTerm} (Other)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                      <div className="flex gap-3 mb-[24px]">
                        <div className="flex-1">
                          <label className="block text-[14px] font-medium text-white/90 mb-[6px]">
                            Email ID <span className="text-red-500">*</span>
                          </label>
                          <input type="email" placeholder="eg : abc@gmail.com" className="w-full p-[12px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[14px] font-medium text-white/90 mb-[6px]">
                            Faculty ID
                          </label>
                          <input type="text" placeholder="(optional)" className="w-full p-[12px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Password Input Group */}
                  <div className="mb-[6px]">
                    <div className="flex justify-between items-end mb-[6px]">
                      <label className="block text-[14px] font-medium text-white/90">Password</label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={`w-full p-[12px] pr-[40px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors ${passwordFieldShake ? 'field-shake' : ''} ${passwordFieldError ? 'border-red-500' : ''}`}
                        value={(authView === "login" && authMode === "user" && otpSent) ? otpCode : password}
                        onChange={(authView === "login" && authMode === "user" && otpSent)
                          ? (e) => { setOtpCode(e.target.value); setFirebaseError(""); setPasswordFieldError(false); setPasswordFieldShake(false) }
                          : (e) => { setPassword(e.target.value); setFirebaseError(""); setPasswordFieldError(false); setPasswordFieldShake(false) }
                        }
                        placeholder={(authView === "login" && authMode === "user" && otpSent) ? 'Enter 6-digit OTP' : 'Password'}
                      />
                      <button
                        type="button"
                        className="absolute right-[12px] text-white/50 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right mt-[6px] mb-[24px]">
                    <span 
                      className="text-[13px] text-[#04895f] underline cursor-pointer hover:text-[#036b4a] transition-colors"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      forgot password?
                    </span>
                  </div>
                </>
              )}

              {/* Validation Error Message */}
              {(validationError || firebaseError) && (
                <div className="mb-3 text-red-500 text-[13px] font-medium text-center animate-fast-fade">
                  {validationError || firebaseError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                id={authMode === "user" ? (authView === "login" ? "sign-in-button" : "sign-up-button") : undefined}
                className="w-full py-[14px] mt-[12px] bg-[#04895f] hover:bg-[#036b4a] transition-colors text-white rounded-[10px] font-semibold text-[15px] border-none cursor-pointer disabled:opacity-50"
                onClick={handlePreSubmit}
                disabled={isLoading}
              >
                {(authMode === "admin" && authView === "admin-signup") || (authMode === "user" && authView === "user-signup") ? "sign up" : "Sign In"}
              </button>

              {authMode === "user" && authView === "login" && (
                <div className="text-center mt-[24px]">
                  <span
                    className="text-[#04895f] text-[15px] font-medium cursor-pointer hover:text-[#036b4a] transition-colors"
                    onClick={() => { setAuthView("user-signup"); setValidationError("") }}
                  >
                    new user?
                  </span>
                </div>
              )}

              {authMode === "user" && authView === "user-signup" && (
                <div className="text-center mt-[16px]">
                  <span className="text-[14px] text-white/50">Already have an account? </span>
                  <span
                    className="text-[#04895f] text-[14px] font-medium cursor-pointer hover:underline"
                    onClick={() => { setAuthView("login"); setValidationError("") }}
                  >
                    Sign in
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Standalone Modals Overlay */}
      {(showOTP || showPasswordCreate || showForgotPassword) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] p-[40px] rounded-[16px] bg-[#2d2d2d] border border-white/5 relative shadow-2xl animate-modal-slide-up">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              onClick={() => {
                setShowOTP(false)
                setShowPasswordCreate(false)
                setShowForgotPassword(false)
                setOtp(["", "", "", "", "", ""])
                setPhoneNumber("") // Reset phone for security
              }}
            >
              ✕
            </button>

            {/* Forgot Password Interface */}
            {showForgotPassword && !showOTP && !showPasswordCreate && (
              <div className="animate-fast-fade">
                <h2 className="text-[20px] font-bold text-white mb-2 text-center">Reset Password</h2>
                <p className="text-white/60 text-[13px] text-center mb-6">Enter your phone number to receive a verification code</p>
                
                <div className="mb-[24px]">
                  <label className="block text-sm font-medium text-white/90 mb-[6px]">
                    Phone Number
                  </label>
                  <div className="flex gap-[10px]">
                    <div className="relative" ref={forgotCountryDropdownRef}>
                      <div 
                        className="bg-[#1e1e1e] text-white py-[12px] pl-[14px] pr-[32px] rounded-[8px] border border-white/10 text-[14px] cursor-pointer h-full flex items-center hover:border-[#04895f] transition-colors min-w-[100px]"
                        onClick={() => setShowForgotCountryDropdown(!showForgotCountryDropdown)}
                      >
                        {COUNTRY_CODES.find(c => c.code === countryCode)?.label || countryCode}
                        <ChevronDown className={`absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 transition-transform duration-300 ${showForgotCountryDropdown ? 'rotate-180' : ''}`} />
                      </div>
                      
                      <div className={`absolute z-20 w-[140px] left-0 bg-[#2d2d2d] border border-white/10 rounded-lg mt-2 max-h-60 overflow-y-auto shadow-xl transition-all duration-300 origin-top-left ${showForgotCountryDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        {COUNTRY_CODES.map((country) => (
                          <div
                            key={country.code}
                            className="px-4 py-3 hover:bg-[#04895f] hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 text-[13px]"
                            onClick={() => {
                              setCountryCode(country.code)
                              setShowForgotCountryDropdown(false)
                            }}
                          >
                            {country.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter your number"
                      className="flex-1 p-[12px] bg-[#1e1e1e] border border-white/10 text-white placeholder:text-white/30 rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-[12px] bg-[#04895f] text-white rounded-[10px] font-semibold transition-colors hover:bg-[#036b4a] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!phoneNumber || isLoading}
                  onClick={async () => {
                    setFirebaseError('');
                    setIsLoading(true);
                    const fullPhone = countryCode + phoneNumber.replace(/\D/g, '');
                    try {
                      const appVerifier = createFreshRecaptcha();
                      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
                      setConfirmationResult(result);
                      setShowOTP(true);
                    } catch (err: any) {
                      setFirebaseError(err.message || 'Failed to send OTP.');
                    }
                    setIsLoading(false);
                  }}
                >
                  Send OTP
                </button>
              </div>
            )}

            {/* OTP Interface */}
            {showOTP && !showPasswordCreate && (
              <div className="animate-fast-fade">
                <h2 className="text-[20px] font-bold text-white mb-2 text-center">Verify OTP</h2>
                <p className="text-white/60 text-[13px] text-center mb-6">Enter the 6-digit code sent to your phone</p>

                <div className="flex gap-3 justify-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      className="w-10 h-12 text-center border border-white/10 rounded-md bg-[#1e1e1e] text-white outline-none focus:border-[#04895f] transition-colors"
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "")
                        const newOtp = [...otp]
                        newOtp[idx] = val
                        setOtp(newOtp)
                        if (val && idx < 5) {
                          const nextInput = document.getElementById(`otp-${idx + 1}`)
                          nextInput?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && idx > 0) {
                          const prevInput = document.getElementById(`otp-${idx - 1}`)
                          prevInput?.focus()
                        }
                      }}
                      id={`otp-${idx}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="bg-[#04895f] text-white w-full mt-6 py-3 rounded-lg hover:bg-[#036b4a] transition-colors font-semibold"
                  onClick={async () => {
                    if (!confirmationResult) {
                      setFirebaseError('Please request OTP first.');
                      return;
                    }
                    setIsLoading(true);
                    setFirebaseError('');
                    const enteredOtp = otp.join('');
                    try {
                      await confirmationResult.confirm(enteredOtp);
                      // OTP verified — decide next screen
                      if (authMode === 'admin' && authView === 'admin-signup') {
                        setOtpSent(false);
                        setShowOTP(false);
                        setShowPasswordCreate(true);
                      } else if (authMode === 'user' && authView === 'user-signup') {
                        setOtpSent(false);
                        setShowOTP(false);
                        setShowPasswordCreate(true);
                      } else if (showForgotPassword) {
                        setOtpSent(false);
                        setShowOTP(false);
                        setIsPasswordResetFlow(true)
                        setShowPasswordCreate(true);
                      } else {
                        // Login confirmed — redirect
                        setIsNavigating(true);
                        router.push('/');
                      }
                    } catch (err: any) {
                      setFirebaseError('Invalid OTP. Please check the code and try again.');
                    }
                    setIsLoading(false);
                  }}
                >
                  Verify OTP
                </button>
              </div>
            )}

            {/* Password Creation / Reset Interface */}
            {showPasswordCreate && (
              <div className="animate-fast-fade">
                {signUpSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#04895f]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#04895f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-[20px] font-bold text-white mb-2">Password Successfully Saved</h2>
                    <p className="text-white/50 text-[14px]">You will be redirected shortly.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-[20px] font-bold text-white mb-6 text-center">Create New Password</h2>
                    <div className="mb-[16px]">
                      <label className="block text-[14px] font-medium text-white/90 mb-[6px]">New Password</label>
                      <div className="relative flex items-center">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="w-full p-[12px] pr-[40px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" className="absolute right-[12px] text-white/50 hover:text-white transition-colors" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {/* Severity bar */}
                      {newPassword.length > 0 && (
                        <>
                          <div className="mt-2 h-1.5 w-full bg-[#1e1e1e] rounded-full overflow-hidden">
                            <div className={`h-full ${pwdData.color} transition-all duration-300`} style={{ width: pwdData.width }}></div>
                          </div>
                          <p className={`text-[12px] mt-1 text-white/70`}>
                            <span className={`${pwdData.color.replace('bg-', 'text-')}`}>{pwdData.text}</span>
                          </p>
                        </>
                      )}
                    </div>
                    <div className="mb-[6px]">
                      <label className="block text-[14px] font-medium text-white/90 mb-[6px]">Confirm Password</label>
                      <div className="relative flex items-center">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          className="w-full p-[12px] pr-[40px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#04895f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={!pwdData.allowConfirm}
                        />
                        <button type="button" className="absolute right-[12px] text-white/50 hover:text-white transition-colors disabled:opacity-50" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={!pwdData.allowConfirm}>
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-[24px] text-center">
                      <button
                        type="button"
                        className="w-full py-[12px] bg-[#04895f] text-white rounded-[10px] font-semibold transition-colors hover:bg-[#036b4a] block disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!pwdData.allowConfirm || !confirmPassword || newPassword !== confirmPassword}
                        onClick={async () => {
                          setFirebaseError("")
                          setIsLoading(true)
                          try {
                            if (isPasswordResetFlow && showForgotPassword) {
                              const hashed = await bcrypt.hash(newPassword, 10)
                              const { data, error } = await supabase
                                .from("website_user_details")
                                .update({ password: hashed })
                                .eq("phone_number", getDigitsPhone())
                                .select("phone_number")
                              if (error) throw error
                              if (!data || data.length === 0) {
                                triggerFieldError("phone", "Phone number not registered.")
                                setIsLoading(false)
                                return
                              }
                            } else {
                              // This is a new user signup - insert into Supabase
                              const hashed = await bcrypt.hash(newPassword, 10)
                              const { error } = await supabase
                                .from("website_user_details")
                                .insert({
                                  phone_number: getDigitsPhone(),
                                  country_code: countryCode,
                                  password: hashed
                                })
                              if (error) throw error
                            }

                            setSignUpSuccess(true)
                            setTimeout(() => {
                              setShowPasswordCreate(false)
                              setShowOTP(false)
                              setSignUpSuccess(false)
                              setNewPassword("")
                              setConfirmPassword("")
                              setPassword("")

                              if (showForgotPassword) {
                                setShowForgotPassword(false)
                                setIsPasswordResetFlow(false)
                                setPhoneNumber("")
                                router.replace("/login")
                              } else {
                                router.push("/")
                              }
                            }, 800)
                          } catch (err: any) {
                            setFirebaseError(err?.message || "Something went wrong. Please try again.")
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                      >
                        Sign Up
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    <div id="recaptcha-container"></div>
    </>
  )
}
