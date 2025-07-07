"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInComponent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <SignIn 
      path="/auth/sign-in"
      routing="path"
      signUpUrl="/auth/sign-up"
      redirectUrl={redirectUrl}
    />
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <SignInComponent />
        </Suspense>
      </div>
    </div>
  );
}