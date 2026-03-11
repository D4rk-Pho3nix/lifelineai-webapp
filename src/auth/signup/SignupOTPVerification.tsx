"use client";

import React, { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface SignupOTPVerificationProps {
    phone: string;
    onVerify: (otp: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function OTPVerification({ phone, onVerify, isLoading, error }: SignupOTPVerificationProps) {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        } else if (value && index === 5) {
            setTimeout(() => {
                const fullOtp = newOtp.join("");
                if (fullOtp.length === 6) {
                    onVerify(fullOtp);
                }
            }, 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        if (pastedData.length === 6) {
            inputRefs.current[5]?.focus();
            onVerify(pastedData);
        } else {
            inputRefs.current[pastedData.length]?.focus();
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-[#111111]">Verify Your Phone Number</h3>
                <p className="text-sm text-gray-500 mt-2">
                    Enter the OTP sent to your registered phone number <span className="font-medium text-black block mt-1">{phone}</span>
                </p>
            </div>

            <div className="flex justify-between gap-2 mt-2">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        disabled={isLoading}
                        className="otp-box w-full"
                        maxLength={1}
                        aria-label={`Digit ${index + 1}`}
                    />
                ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button
                onClick={() => onVerify(otp.join(""))}
                disabled={isLoading || otp.join("").length !== 6}
                className="login-btn mt-4"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign Up"}
            </button>
        </div>
    );
}
