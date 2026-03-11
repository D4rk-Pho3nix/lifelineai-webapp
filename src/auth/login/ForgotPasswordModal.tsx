"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/src/utils/supabase/client";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleRequestOTP = async () => {
        if (!phone || phone.length < 5) {
            setMessage({ type: "error", text: "Please enter a valid phone number." });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const supabase = createClient();
            const fullPhoneNumber = `${countryCode}${phone}`;

            const { error } = await supabase.auth.signInWithOtp({
                phone: fullPhoneNumber,
            });

            if (error) {
                if (error.status === 429) {
                    throw new Error("Too many requests. Please try again later.");
                }
                throw error;
            }

            setMessage({ type: "success", text: "OTP sent successfully. Please check your phone." });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to send OTP. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-overlay"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-[14px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-[480px] p-10 modal-content mx-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                <h2 className="text-xl font-bold tracking-tight text-[#111111] mb-6">Password Recovery</h2>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111111]">Phone Number</label>
                        <div className="flex gap-2">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                                <SelectTrigger className="country-code-selector w-[100px] h-[44px] rounded-lg focus:ring-0">
                                    <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="+91">IN (+91)</SelectItem>
                                    <SelectItem value="+1">US (+1)</SelectItem>
                                    <SelectItem value="+44">UK (+44)</SelectItem>
                                    <SelectItem value="+61">AU (+61)</SelectItem>
                                    <SelectItem value="+81">JP (+81)</SelectItem>
                                </SelectContent>
                            </Select>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter your number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                className="login-input flex-1"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="min-h-[24px]">
                        {message && (
                            <p className={`text-sm ${message.type === "error" ? "text-red-500" : "text-[#16a34a]"}`}>
                                {message.text}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleRequestOTP}
                        disabled={isLoading || !phone}
                        className="login-btn mt-2 h-[44px] bg-black hover:bg-[#1a1a1a] text-white rounded-lg w-full font-medium transition-colors disabled:bg-[#999999]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request OTP"}
                    </button>
                </div>
            </div>
        </div>
    );
}
