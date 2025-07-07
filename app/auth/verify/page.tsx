"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract after_sign_in_url and after_sign_up_url from search params
    const afterSignInUrl = searchParams.get("after_sign_in_url") || "/reservaciones";
    const afterSignUpUrl = searchParams.get("after_sign_up_url") || "/bienvenida";
    
    // Verify component is not explicitly rendered as Clerk handles this client-side
    // This page serves as a container for Clerk's verification UI
    
    // If the verification process completes, Clerk will handle redirecting to the appropriate URL
    // This page is a fallback in case the automatic redirection doesn't work
    
    console.log("Verification page loaded with params:", {
      afterSignInUrl,
      afterSignUpUrl
    });
    
    // No explicit redirection here as Clerk should handle this automatically
  }, [router, searchParams]);

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Verificando tu cuenta</h1>
      <p className="mb-4">Por favor espera mientras verificamos tu cuenta...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyComponent />
        </Suspense>
      </div>
    </div>
  );
}