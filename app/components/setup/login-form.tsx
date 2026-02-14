"use client";

import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Loader2, Mail, Type, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [signupStep, setSignupStep] = useState<1 | 2>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Login Data
    const [loginData, setLoginData] = useState({
        username: "",
        password: ""
    });

    // Signup Data
    const [signupData, setSignupData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        userId: "", // Returned from step 1
        password: ""
    });

    const isLoginValid = loginData.username && loginData.password;
    const isSignupStep1Valid = signupData.firstName && signupData.lastName && signupData.email && signupData.username;
    const isSignupStep2Valid = signupData.password && signupData.password.length >= 6;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://localhost:9100/auth/login/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                onSuccess();
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            setError("Failed to connect to authentication server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://localhost:9100/auth/signup/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: signupData.email,
                    username: signupData.username,
                    firstName: signupData.firstName,
                    lastName: signupData.lastName
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.userId) {
                setSignupData(prev => ({ ...prev, userId: data.userId }));
                setSignupStep(2);
            } else {
                setError(data.message || "Failed to start signup. Username or email might be taken.");
            }
        } catch (err) {
            setError("Failed to connect to signup server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("http://localhost:9100/auth/signup/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: signupData.userId,
                    password: signupData.password
                }),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {
                setLoginData(prev => ({ ...prev, username: signupData.username }));
                setMode('login');
                setSuccess("Account created successfully. Please sign in.");
                setSignupStep(1);
                setSignupData(prev => ({ ...prev, password: "", userId: "" }));
            } else {
                setError(data.message || "Failed to set password");
            }
        } catch (err) {
            setError("Failed to complete signup");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError("");
        setSuccess("");
        setSignupStep(1);
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[440px] bg-black/40 backdrop-blur-2xl rounded-[32px] p-10 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col items-center"
        >
            <div className="mb-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 relative">
                    <Image
                        src="/logo/cockpit.svg"
                        alt="Reglook Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-[28px] font-semibold text-white tracking-tight">
                        {mode === 'login' ? "Sign in" : "Create Account"}
                    </h1>
                    <p className="text-white/60 text-[15px]">
                        {mode === 'login'
                            ? "Use your cockpit account to continue"
                            : signupStep === 1
                                ? "Enter your details to get started"
                                : "Choose a secure password"}
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'login' ? (
                    <motion.form
                        key="login-form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleLogin}
                        className="w-full space-y-5"
                    >
                        <div className="space-y-4">
                            <div className="relative group">
                                <User strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    autoComplete="username"
                                    className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                    value={loginData.username}
                                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff strokeWidth={2} className="w-4.5 h-4.5" />
                                    ) : (
                                        <Eye strokeWidth={2} className="w-4.5 h-4.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm justify-center border border-red-400/20"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-xl text-sm justify-center border border-green-400/20"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {success}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={!isLoginValid || isLoading}
                            className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isLoginValid && !isLoading
                                ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                : "bg-white/10 text-white/30 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                            ) : (
                                <>
                                    Sign In
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form
                        key="signup-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={signupStep === 1 ? handleSignupStart : handleSignupFinish}
                        className="w-full space-y-5"
                    >
                        {signupStep === 1 ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <Type strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all invalid:border-red-500/50"
                                            value={signupData.firstName}
                                            onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-4 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                            value={signupData.lastName}
                                            onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <Mail strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    />
                                </div>

                                <div className="relative group">
                                    <User strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        autoComplete="off"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={signupData.username}
                                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative group">
                                    <Lock strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 transition-colors group-focus-within:text-white" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create Password"
                                        autoComplete="new-password"
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:ring-0 focus:ring-white/20 transition-all"
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff strokeWidth={2} className="w-4.5 h-4.5" />
                                        ) : (
                                            <Eye strokeWidth={2} className="w-4.5 h-4.5" />
                                        )}
                                    </button>
                                </div>
                                <div className="text-white/40 text-[13px] text-center">
                                    Password must be at least 6 characters
                                </div>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm justify-center border border-red-400/20"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={!((signupStep === 1 && isSignupStep1Valid) || (signupStep === 2 && isSignupStep2Valid)) || isLoading}
                            className={`w-full h-13 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${((signupStep === 1 && isSignupStep1Valid) || (signupStep === 2 && isSignupStep2Valid)) && !isLoading
                                ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 active:scale-[0.98]"
                                : "bg-white/10 text-white/30 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                            ) : (
                                <>
                                    {signupStep === 1 ? "Start Signup" : "Create Account"}
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-white/5 w-full text-center">
                <button
                    type="button"
                    onClick={toggleMode}
                    className="text-white/40 text-sm hover:text-white/40 transition-colors"
                >
                    {mode === 'login' ? (
                        <>Don't have an account? <span className="text-white hover:underline font-medium">Create one</span></>
                    ) : (
                        <>Already have an account? <span className="text-white hover:underline font-medium">Sign In</span></>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
