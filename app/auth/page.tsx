"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignUp } from "@clerk/nextjs";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "sign-in";
  const redirectUrl = searchParams.get("redirect") || "/";
  
  // Extract after_sign_in_url and after_sign_up_url from the hash
  useEffect(() => {
    // If there's a hash, extract the parameters
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the # character
      
      // Handle Clerk's verify flow
      if (hash.startsWith("/verify")) {
        // No need to redirect, let Clerk handle the verification
        return;
      }
    }
  }, [router]);

  // Determine which component to render based on mode
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {(mode === "sign-in" || !mode) && (
          <SignIn 
            path="/auth"
            routing="path"
            signUpUrl="/auth?mode=sign-up"
          />
        )}
        
        {mode === "sign-up" && (
          <SignUp 
            path="/auth" 
            routing="path"
            signInUrl="/auth?mode=sign-in"
          />
        )}
      </div>
    </div>
  );
}