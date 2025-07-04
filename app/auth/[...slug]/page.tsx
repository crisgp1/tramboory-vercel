"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

export default function AuthCatchAll() {
  const pathname = usePathname();
  
  // Determine which component to render based on the path
  if (pathname?.includes("/sign-in")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignIn 
            path="/auth/sign-in"
            routing="path"
            signUpUrl="/auth/sign-up"
          />
        </div>
      </div>
    );
  }
  
  if (pathname?.includes("/sign-up")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignUp 
            path="/auth/sign-up" 
            routing="path"
            signInUrl="/auth/sign-in"
          />
        </div>
      </div>
    );
  }
  
  // For any verification flow or other paths
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn 
          path="/auth"
          routing="path"
          signUpUrl="/auth/sign-up"
        />
      </div>
    </div>
  );
}