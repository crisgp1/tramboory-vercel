"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignUpComponent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/bienvenida";

  return (
    <SignUp 
      path="/auth/sign-up"
      routing="path"
      signInUrl="/auth/sign-in"
      redirectUrl={redirectUrl}
    />
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <SignUpComponent />
        </Suspense>
      </div>
    </div>
  );
}