"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { OTPVerification } from "./OTPVerification";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { createClient } from "@/src/utils/supabase/client";
import "./login.css";

export function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState<"credentials" | "otp">("credentials");
    const [phoneData, setPhoneData] = useState({ countryCode: "+91", number: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleCredentialsSubmit = async (countryCode: string, phone: string, password: string) => {
        setIsLoading(true);
        setError(null);
        setPhoneData({ countryCode, number: phone });

        try {
            const fullPhoneNumber = `${countryCode}${phone}`;

            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                phone: fullPhoneNumber,
                password: password,
            });

            if (signInError) {
                throw new Error(signInError.message || "Invalid phone number or password.");
            }

            await supabase.auth.signOut();

            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: fullPhoneNumber,
            });

            if (otpError) {
                throw new Error("Failed to send verification code. " + otpError.message);
            }

            setStep("otp");

        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPVerify = async (otp: string) => {
        setIsLoading(true);
        setError(null);
        const fullPhoneNumber = `${phoneData.countryCode}${phoneData.number}`;

        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                phone: fullPhoneNumber,
                token: otp,
                type: 'sms',
            });

            if (verifyError) {
                throw new Error("Invalid or expired OTP.");
            }

            if (data.session) {
                const role = data.user?.user_metadata?.role || 'user';
                if (role === 'admin') {
                    router.push("/admin");
                } else {
                    router.push("/");
                }
            } else {
                throw new Error("Session could not be established.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to verify OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg-shape-1" />
            <div className="login-bg-shape-2" />
            <div className="login-bg-arc-1" />
            <div className="login-bg-accent" />

            <nav className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <img
                        src="/assets/login/logo.png"
                        alt="Lifeline-AI Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-3xl font-bold tracking-tight text-[#111111]" style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}>
                        Lifeline-AI
                    </div>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                    <button className="px-5 py-2 rounded-lg bg-black text-white hover:bg-[#1a1a1a] transition-colors border border-black font-semibold">
                        Login
                    </button>
                    <button
                        onClick={() => router.push('/signup')}
                        className="px-5 py-2 rounded-lg bg-white text-black hover:bg-gray-50 transition-colors border border-black font-semibold"
                    >
                        Sign Up
                    </button>
                </div>
            </nav>

            <div className="flex flex-col md:flex-row items-center justify-center gap-16 lg:gap-32 w-full max-w-6xl px-4 z-10 page-transition-enter">

                <div className="hidden md:flex flex-col items-center justify-center">
                    <div className="relative w-[560px] h-[560px]">
                        <img
                            src="/assets/login/login-illustration.png"
                            alt="Security Illustration"
                            className="object-contain w-full h-full drop-shadow-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23e5e5e5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' /%3E%3C/svg%3E`;
                            }}
                        />
                    </div>
                </div>

                <div className="login-card">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Welcome back</h1>
                        <p className="text-sm text-gray-500 mt-2">Login to access your portal.</p>
                    </div>

                    <div className="relative overflow-hidden min-h-[280px]">
                        {step === "credentials" ? (
                            <LoginForm
                                onSubmit={handleCredentialsSubmit}
                                isLoading={isLoading}
                                error={error}
                                onForgotPassword={() => setIsForgotPasswordOpen(true)}
                            />
                        ) : (
                            <OTPVerification
                                phone={`${phoneData.countryCode} ${phoneData.number}`}
                                onVerify={handleOTPVerify}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}
                    </div>
                </div>

                <ForgotPasswordModal
                    isOpen={isForgotPasswordOpen}
                    onClose={() => setIsForgotPasswordOpen(false)}
                />
            </div>
        </div>
    );
}
