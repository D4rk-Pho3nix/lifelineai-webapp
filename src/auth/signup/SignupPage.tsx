"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "./SignupForm";
import { OTPVerification } from "./SignupOTPVerification";
import { SignupSuccessModal } from "./SignupSuccessModal";
import { createClient } from "@/src/utils/supabase/client";
import "../login/login.css"; // Reuse login styles for inputs/cards
import "./signup.css"; // Specific signup bg shapes and modal animations

export function SignupPage() {
    const router = useRouter();
    const supabase = createClient();

    // Manage step states
    const [step, setStep] = useState<"details" | "otp" | "success">("details");

    // Store user info during registration workflow
    const [registrationData, setRegistrationData] = useState({
        fullName: "",
        age: "",
        gender: "",
        countryCode: "+91",
        phone: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Registration Step
    const handleDetailsSubmit = async (data: any) => {
        setIsLoading(true);
        setError(null);
        setRegistrationData(data);

        try {
            const fullPhoneNumber = `${data.countryCode}${data.phone}`;

            // Create user in Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                phone: fullPhoneNumber,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName,
                        age: parseInt(data.age, 10),
                        gender: data.gender,
                        role: "user" // Default role
                    }
                }
            });

            if (signUpError) {
                // Handle specific errors like user already exists
                throw new Error(signUpError.message || "Failed to create account.");
            }

            // Move to OTP step because phone signups implicitly require verification
            setStep("otp");

        } catch (err: any) {
            setError(err.message || "An error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    // OTP Verification Step
    const handleOTPVerify = async (otp: string) => {
        setIsLoading(true);
        setError(null);
        const fullPhoneNumber = `${registrationData.countryCode}${registrationData.phone}`;

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
                setStep("success");
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
        <div className="login-container signup-card-container">
            {/* Custom Atmospheric Dark Shapes for Signup */}
            <div className="signup-bg-shape-1" />
            <div className="signup-bg-shape-2" />
            <div className="signup-bg-arc-1" />
            <div className="signup-bg-accent" />
            <div className="signup-bg-accent-2" />

            {/* Navigation Bar matching Login Page but with Signup Active states */}
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
                    <button
                        onClick={() => router.push('/login')}
                        className="px-5 py-2 rounded-lg bg-white text-black hover:bg-gray-50 transition-colors border border-black font-semibold"
                    >
                        Login
                    </button>
                    {/* Active State for Sign Up: Black bg, White text */}
                    <button className="px-5 py-2 rounded-lg bg-black text-white hover:bg-[#1a1a1a] transition-colors border border-black font-semibold">
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
                    {step === "details" && (
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Create Account</h1>
                            <p className="text-sm text-gray-500 mt-2">To join Lifeline AI, please fill the details below.</p>
                        </div>
                    )}

                    <div className="relative overflow-visible min-h-[280px]">
                        {step === "details" && (
                            <SignupForm
                                onSubmit={handleDetailsSubmit}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}

                        {step === "otp" && (
                            <OTPVerification
                                phone={`${registrationData.countryCode} ${registrationData.phone}`}
                                onVerify={handleOTPVerify}
                                isLoading={isLoading}
                                error={error}
                            />
                        )}
                    </div>
                </div>

                <SignupSuccessModal
                    isOpen={step === "success"}
                    onComplete={() => router.push('/login')}
                />
            </div>
        </div>
    );
}
