"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Zap, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setAuth } from "@/lib/auth";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // UI toggles and error handling state
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  // React Hook Form for easy validation without messy controlled components
  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const switchMode = (mode: "login" | "register") => {
    setServerError("");
    reset();
    setAuthMode(mode);
  };

  const onSubmit = async (data: any) => {
    try {
      setServerError("");
      
      // Depending on the mode, we either login or register.
      // In a larger app, we might split this into two separate forms, 
      // but for this simple landing page, a toggle works perfectly.
      if (authMode === "login") {
        const payload = {
          email: data.email,
          password: data.password,
        };
        const res = await api.post("/api/auth/login", payload);
        
        // Save the token and redirect immediately to the dashboard.
        // `replace` is used so the user can't hit 'Back' to return to the login page.
        setAuth(res.data.access_token, res.data.user);
        router.replace("/dashboard");
      } else {
        const payload = {
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          company: data.company,
        };
        const res = await api.post("/api/auth/register", payload);
        setAuth(res.data.access_token, res.data.user);
        router.replace("/dashboard");
      }
    } catch (err: any) {
      // FastAPI throws Pydantic validation errors as arrays, so we stringify them 
      // if it's an object. Otherwise, we just show the raw detail string.
      let errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === "object") {
        errorDetail = JSON.stringify(errorDetail);
      }
      setServerError(errorDetail || `Failed to ${authMode}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-slate-50 text-gray-900">
      {/* LEFT SIDE: BRANDING (Split Screen) */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-1/2 bg-accent-600 flex-col justify-between p-12 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white text-accent-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Zap className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Mini AI SDR</span>
        </div>

        <div className="relative z-10 w-full flex-1 flex flex-col justify-center mt-12 mb-8 pr-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl lg:text-[4rem] font-extrabold leading-[1.1] mb-8 tracking-tight text-white drop-shadow-sm"
          >
            Supercharge your <br />
            outbound sales.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-accent-100 mb-14 max-w-lg font-medium leading-relaxed"
          >
            Let our AI agent qualify leads and draft hyper-personalized emails while you focus on closing deals.
          </motion.p>
          
          <div className="space-y-6">
            {[
              "Automated lead qualification",
              "AI-powered email generation",
              "Seamless CRM integration",
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <CheckCircle className="w-5 h-5 text-green-300 drop-shadow-sm" />
                </div>
                <span className="text-white font-medium text-xl drop-shadow-sm tracking-tight">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-accent-200 font-medium">
          © {new Date().getFullYear()} Mini AI SDR. All rights reserved.
        </div>
      </motion.div>

      {/* RIGHT SIDE: AUTHENTICATION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-slate-50 overflow-hidden">
        {/* Subtle background blob for right side */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Header (visible only on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-accent-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">Mini AI SDR</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                {authMode === "login"
                  ? "Sign in to access your dashboard"
                  : "Start automating your sales process today"}
              </p>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-700">{serverError}</p>
                  </div>
                )}

                {authMode === "register" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className={cn("input-field", errors.fullName && "border-red-500 focus:ring-red-500")}
                        {...registerForm("fullName", { required: "Full name is required" })}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-500">{errors.fullName.message as string}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Company Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Acme Inc"
                        className="input-field"
                        {...registerForm("company")}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className={cn("input-field", errors.email && "border-red-500 focus:ring-red-500")}
                    {...registerForm("email", {
                      required: "Email is required",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email" },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn("input-field pr-10", errors.password && "border-red-500 focus:ring-red-500")}
                      {...registerForm("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message as string}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {authMode === "login" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : (
                    authMode === "login" ? "Sign In" : "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => switchMode(authMode === "login" ? "register" : "login")}
                  className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
