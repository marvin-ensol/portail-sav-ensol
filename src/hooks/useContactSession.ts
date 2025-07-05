import { useEffect } from 'react';
import { getContactSession, clearContactSession } from '@/utils/contactCookies';
import type { IdentificationMethod } from '@/types/hubspot';

interface UseContactSessionProps {
  onAutoSubmit: (method: IdentificationMethod, value: string) => Promise<void>;
  setFormData: (data: { method: IdentificationMethod | null; value: string }) => void;
  setAutoSubmitted: (submitted: boolean) => void;
  currentStep: number;
}

export const useContactSession = ({
  onAutoSubmit,
  setFormData,
  setAutoSubmitted,
  currentStep
}: UseContactSessionProps) => {
  useEffect(() => {
    // Only check for session on initial load (step 1)
    if (currentStep !== 1) return;
    
    const session = getContactSession();
    console.log('Cookie session check:', { session, currentStep });
    if (session) {
      console.log('Found contact session, auto-submitting:', session);
      setFormData({ method: session.method, value: session.value });
      setAutoSubmitted(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Auto-submission timed out, clearing session');
        setAutoSubmitted(false);
        clearContactSession();
      }, 10000); // 10 second timeout
      
      onAutoSubmit(session.method, session.value)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    }
  }, [currentStep, onAutoSubmit, setFormData, setAutoSubmitted]);

  const handleDisconnect = () => {
    clearContactSession();
    window.location.reload();
  };

  const handleSkipAutoVerification = () => {
    setAutoSubmitted(false);
    clearContactSession();
  };

  return { handleDisconnect, handleSkipAutoVerification };
};