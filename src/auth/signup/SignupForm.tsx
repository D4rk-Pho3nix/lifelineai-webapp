"use client";

import React, { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./signup.css";

interface SignupFormProps {
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function SignupForm({ onSubmit, isLoading, error }: SignupFormProps) {
    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState("");

    const validateForm = () => {
        setValidationError("");

        if (!fullName.trim() || !age || !gender || !phone || !password || !confirmPassword) {
            setValidationError("All fields are required.");
            return false;
        }

        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum <= 0) {
            setValidationError("Age must be a valid positive integer.");
            return false;
        }

        if (phone.length < 8) {
            setValidationError("Please enter a valid phone number.");
            return false;
        }

        if (password.length < 6) {
            setValidationError("Password must be at least 6 characters.");
            return false;
        }

        if (password !== confirmPassword) {
            setValidationError("Passwords do not match.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        await onSubmit({
            fullName,
            age,
            gender,
            countryCode,
            phone,
            password
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#111111]">Full Name</label>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="login-input"
                    required
                    disabled={isLoading}
                />
            </div>

            {/* Age & Gender Row */}
            <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-[#111111]">Age</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="login-input"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-[#111111]">Gender</label>
                    <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                        <SelectTrigger className={`w-full h-[44px] rounded-lg focus:ring-0 transition-colors border ${gender ? 'bg-black text-white border-black signup-gender-trigger' : 'bg-[#e5e5e5] text-[#111111] border-[#e5e5e5]'}`}>
                            <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 signup-dropdown-content">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#111111]">Phone Number</label>
                <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode} disabled={isLoading}>
                        <SelectTrigger className="country-code-selector w-[100px] h-[44px] rounded-lg focus:ring-0">
                            <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 signup-dropdown-content">
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
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#111111]">New Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input w-full pr-10"
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#111111]">Confirm Password</label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="login-input w-full pr-10"
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="min-h-[24px]">
                {(validationError || error) && (
                    <p className="text-red-500 text-sm font-medium">{validationError || error}</p>
                )}
            </div>

            <button type="submit" disabled={isLoading} className="login-btn mt-1">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
            </button>
        </form>
    );
}
