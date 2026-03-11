"use client"

import { useState } from "react"
import { Eye, EyeOff, ChevronDown } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [role, setRole] = useState("user")
  const [countryCode, setCountryCode] = useState("+91")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-[#1e1e1e] text-white font-sans">
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
          <button className="bg-[#10b981] text-white rounded-[8px] px-[20px] py-[8px] font-medium text-[14px]">
            Login
          </button>
          <button className="bg-transparent border border-white/20 text-white rounded-[8px] px-[20px] py-[8px] font-medium text-[14px] hover:border-white transition-colors">
            Sign Up
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
          {/* Typography */}
          <h1 className="text-[28px] font-bold text-white mb-[6px]">Welcome back</h1>
          <p className="text-[14px] text-white/60 mb-[28px]">Login to access your portal.</p>

          <form onSubmit={handleSubmit}>
            {/* Role Switcher */}
            <div className="flex border border-white/10 rounded-[10px] overflow-hidden mb-[24px]">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-colors ${role === "user" ? "bg-[#10b981] text-white" : "bg-transparent text-white/50 hover:text-white"
                  }`}
                onClick={() => setRole("user")}
              >
                User Login
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium transition-colors ${role === "admin" ? "bg-[#10b981] text-white" : "bg-transparent text-white/50 hover:text-white"
                  }`}
                onClick={() => setRole("admin")}
              >
                Admin Login
              </button>
            </div>

            {/* Phone Number Input Group */}
            <div className="mb-[16px]">
              <label className="block text-sm font-medium text-white/90 mb-[6px]">Phone Number</label>
              <div className="flex gap-[10px]">
                <div className="relative">
                  <select
                    className="appearance-none bg-[#1e1e1e] text-white py-[12px] pl-[14px] pr-[32px] rounded-[8px] border border-white/10 text-[14px] outline-none cursor-pointer h-full focus:border-[#10b981] transition-colors"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">IN (+91)</option>
                    <option value="+1">US (+1)</option>
                    <option value="+44">UK (+44)</option>
                    <option value="+61">AU (+61)</option>
                  </select>
                  <ChevronDown className="absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                </div>
                <input
                  type="tel"
                  placeholder="Enter your number"
                  className="flex-1 p-[12px] bg-[#1e1e1e] border border-white/10 text-white placeholder:text-white/30 rounded-[8px] text-[14px] outline-none focus:border-[#10b981] transition-colors"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="mb-[6px]">
              <label className="block text-[14px] font-medium text-white/90 mb-[6px]">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-[12px] pr-[40px] bg-[#1e1e1e] border border-white/10 text-white rounded-[8px] text-[14px] outline-none focus:border-[#10b981] transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div className="text-left mt-[6px] mb-[24px]">
              <span className="text-[13px] text-white underline cursor-pointer hover:text-white/80 transition-colors">
                Forgot password?
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-[14px] mt-[24px] bg-[#10b981] hover:bg-[#059669] transition-colors text-white rounded-[10px] font-semibold text-[15px] border-none cursor-pointer"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
