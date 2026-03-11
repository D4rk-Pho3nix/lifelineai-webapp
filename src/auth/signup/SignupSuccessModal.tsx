"use client";

import React, { useEffect } from "react";
import "./signup.css";

interface SignupSuccessModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function SignupSuccessModal({ isOpen, onComplete }: SignupSuccessModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Auto redirect after 3 seconds
            const timer = setTimeout(() => {
                onComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onComplete]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 relative z-10 flex flex-col items-center modal-content">
                {/* SVG Animated Tick */}
                <svg
                    className="success-checkmark"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 52 52"
                >
                    <circle
                        className="success-tick-circle"
                        cx="26"
                        cy="26"
                        r="25"
                        fill="none"
                    />
                    <path
                        className="success-tick-path"
                        fill="none"
                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                </svg>

                <h2 className="text-2xl font-bold text-[#111111] mt-6 text-center">
                    Successfully Signed Up
                </h2>
                <p className="text-gray-500 text-center mt-3 leading-relaxed">
                    You have been successfully signed up to Lifeline AI!!!
                </p>

                <p className="text-sm text-gray-400 mt-8 animate-pulse text-center">
                    Redirecting to login...
                </p>
            </div>
        </div>
    );
}
