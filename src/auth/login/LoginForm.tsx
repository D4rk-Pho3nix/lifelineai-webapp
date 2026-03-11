"use client";

import React, { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LoginFormProps {
    onSubmit: (countryCode: string, phone: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    onForgotPassword: () => void;
}

export function LoginForm({ onSubmit, isLoading, error, onForgotPassword }: LoginFormProps) {
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<"user" | "admin">("user");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !password) return;
        await onSubmit(countryCode, phone, password);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex gap-4 mb-1">
                <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${role === "user"
                        ? "bg-[#16a34a] text-white border-[#16a34a]"
                        : "bg-white text-[#111111] border-[#111111]"
                        }`}
                >
                    User Login
                </button>
                <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${role === "admin"
                        ? "bg-[#16a34a] text-white border-[#16a34a]"
                        : "bg-white text-[#111111] border-[#111111]"
                        }`}
                >
                    Admin Login
                </button>
            </div>

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
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#111111]">Password</label>
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
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[13px] font-medium text-black hover:cursor-pointer self-start focus:outline-none"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                >
                    Forgot password?
                </button>
            </div>

            <div className="min-h-[24px]">
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <button type="submit" disabled={isLoading || !phone || !password} className="login-btn mt-1">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
            </button>
        </form>
    );
}
