'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { supabase } from '@/src/supabaseClient';
import bcrypt from 'bcryptjs';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [phoneFieldError, setPhoneFieldError] = useState(false);
  const [passwordFieldError, setPasswordFieldError] = useState(false);
  const [phoneFieldShake, setPhoneFieldShake] = useState(false);
  const [passwordFieldShake, setPasswordFieldShake] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpError, setOtpError] = useState('');
  const [otpShake, setOtpShake] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showUserRestriction, setShowUserRestriction] = useState(false);

  const getDigitsPhone = () => phoneNumber.replace(/\\D/g, '');

  const triggerFieldError = (field: 'phone' | 'password', message: string) => {
    setError(message);
    if (field === 'phone') {
      setPhoneFieldError(true);
      setPhoneFieldShake(true);
      setTimeout(() => {
        setPhoneFieldShake(false);
        setPhoneFieldError(false);
      }, 500);
      return;
    }
    setPasswordFieldError(true);
    setPasswordFieldShake(true);
    setTimeout(() => {
      setPasswordFieldShake(false);
      setPasswordFieldError(false);
    }, 500);
  };

  const createFreshRecaptcha = (): any => {
    if ((window as any).recaptchaVerifier) {
      try { (window as any).recaptchaVerifier.clear(); } catch {}
      (window as any).recaptchaVerifier = null;
    }
    const oldEl = document.getElementById('recaptcha-dynamic-container-admin');
    if (oldEl) oldEl.remove();
    const el = document.createElement('div');
    el.id = 'recaptcha-dynamic-container-admin';
    el.style.display = 'none';
    document.body.appendChild(el);
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-dynamic-container-admin', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {},
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setOtpError('');
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
      
      const { data: row, error: fetchError } = await supabase
        .from('website_admin_details')
        .select('phone_number,country_code,password_hash')
        .eq('phone_number', phoneDigits)
        .maybeSingle();
      if (fetchError) throw fetchError;

      if (!row) {
        triggerFieldError('phone', 'Phone number not registered.');
        setIsLoading(false);
        return;
      }

      if (!forgotMode) {
        const ok = await bcrypt.compare(password, (row as any).password_hash || '');
        if (!ok) {
          triggerFieldError('password', 'Incorrect password. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      const countryCode = (row as any).country_code || '+91';
      const fullPhone = `${countryCode}${phoneDigits}`;
      const appVerifier = createFreshRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to send OTP.');
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    if (isLoading) return;
    setIsLoading(true);
    setOtpError('');
    try {
      const entered = otpDigits.join('');
      await confirmationResult.confirm(entered);
      if (forgotMode) {
        setShowResetForm(true);
      } else {
        router.push('/admin');
      }
    } catch {
      setOtpError('Invalid OTP. Please try again.');
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const hashed = await bcrypt.hash(newPassword, 10);
      const { data, error: updateError } = await supabase
        .from('website_admin_details')
        .update({ password_hash: hashed })
        .eq('phone_number', getDigitsPhone())
        .select('phone_number');
      if (updateError) throw updateError;
      if (!data || data.length === 0) {
        triggerFieldError('phone', 'Phone number not registered.');
        setIsLoading(false);
        return;
      }
      setResetSuccess(true);
      setTimeout(() => {
        setForgotMode(false);
        setOtpSent(false);
        setShowResetForm(false);
        setResetSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        setOtpDigits(['', '', '', '', '', '']);
        setPhoneNumber('');
        setPassword('');
        router.replace('/admin/login');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If user restriction is shown, render only the restriction modal on login page background
  if (showUserRestriction) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0f1117', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Subtle bg glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: '#04895f', filter: 'blur(100px)' }} />
        </div>

        {/* User Restriction Modal */}
        <div className="w-full max-w-md rounded-2xl p-8 relative animate-in fade-in zoom-in duration-300"
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
                setError('');
              }}
            >
              Understood
            </button>
            <a
              href="/login"
              className="mt-4 text-sm transition-colors duration-150"
              style={{ color: '#04895f' }}
            >
              Go to User Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0f1117', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes fieldShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .field-shake { animation: fieldShake 0.5s ease-out; }
      `}</style>
      {/* Subtle bg glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#04895f', filter: 'blur(100px)' }} />
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-8 relative"
        style={{
          background: '#1a1d24',
          border: '1px solid #2d3139',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(4,137,95,0.15)', border: '1px solid rgba(4,137,95,0.3)' }}>
            <ShieldCheck size={28} style={{ color: '#04895f' }} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Lifeline AI — Admin Portal</p>
        </div>

        {/* Amber restricted access warning */}
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-5"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#f59e0b' }}>
            <strong>Restricted Access — Admin Only.</strong> Unauthorized access attempts are logged and reported.
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => { setPhoneNumber(e.target.value.replace(/[^0-9]/g, '')); setError(''); setPhoneFieldError(false); setPhoneFieldShake(false); }}
                placeholder="Enter phone number"
                className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none transition-all duration-200 ${phoneFieldShake ? 'field-shake' : ''}`}
                style={{ background: '#232530', border: `1px solid ${phoneFieldError ? '#ef4444' : '#2d3139'}`, color: '#ffffff' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#04895f'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(4,137,95,0.15)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = phoneFieldError ? '#ef4444' : '#2d3139'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            {!forgotMode && (
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); setPasswordFieldError(false); setPasswordFieldShake(false); }}
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-[14px] outline-none transition-all duration-200 ${passwordFieldShake ? 'field-shake' : ''}`}
                    style={{ background: '#232530', border: `1px solid ${passwordFieldError ? '#ef4444' : '#2d3139'}`, color: '#ffffff' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#04895f'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(4,137,95,0.15)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = passwordFieldError ? '#ef4444' : '#2d3139'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <EyeOff size={16} style={{ color: '#9ca3af' }} />
                      : <Eye size={16} style={{ color: '#9ca3af' }} />}
                  </button>
                </div>
              </div>
            )}

            {!forgotMode && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  className="text-[12px] underline"
                  style={{ color: '#04895f' }}
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                    setPassword('');
                  }}
                >
                  forgot password?
                </button>
              </div>
            )}

            {(error || otpError) && (
              <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                {error || otpError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: '#04895f' }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#056b4a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#04895f'; }}
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Sending OTP…</>
              ) : (
                forgotMode ? 'Send OTP' : 'Sign In'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!showResetForm ? (
              <>
                <p className="text-[13px] text-center" style={{ color: '#9ca3af' }}>
                  Enter the 6-digit OTP sent to your phone
                </p>
                <div className={`flex justify-center gap-2 ${otpShake ? 'field-shake' : ''}`}>
                  {otpDigits.map((d, idx) => (
                    <input
                      key={idx}
                      value={d}
                      maxLength={1}
                      inputMode="numeric"
                      className="w-10 h-12 text-center rounded-xl text-[16px] outline-none transition-all duration-200"
                      style={{ background: '#232530', border: '1px solid #2d3139', color: '#ffffff' }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                        const next = [...otpDigits];
                        next[idx] = val;
                        setOtpDigits(next);
                        setOtpError('');
                      }}
                    />
                  ))}
                </div>
                {!!otpError && (
                  <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    {otpError}
                  </div>
                )}
                <button
                  type="button"
                  disabled={isLoading || otpDigits.join('').length < 6}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ background: '#04895f' }}
                  onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#056b4a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#04895f'; }}
                  onClick={handleVerifyOtp}
                >
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : 'Verify OTP'}
                </button>
              </>
            ) : (
              <>
                {resetSuccess ? (
                  <div className="rounded-lg px-3 py-3 text-[12px] text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                    Password updated successfully. Redirecting…
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                        New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none transition-all duration-200"
                        style={{ background: '#232530', border: '1px solid #2d3139', color: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-[14px] outline-none transition-all duration-200"
                        style={{ background: '#232530', border: '1px solid #2d3139', color: '#ffffff' }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      style={{ background: '#04895f' }}
                      onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#056b4a'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#04895f'; }}
                      onClick={handleUpdatePassword}
                    >
                      {isLoading ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : 'Update Password'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-center text-[11px] mt-5" style={{ color: '#9ca3af' }}>
          Not an admin?{' '}
          <a href="/login" className="transition-colors duration-150" style={{ color: '#04895f' }}>
            Go to User Login
          </a>
        </p>
      </div>
    </div>
  );
}
