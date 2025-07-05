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
    if (session) {
      console.log('Found contact session, auto-submitting:', session);
      setFormData({ method: session.method, value: session.value });
      setAutoSubmitted(true);
      onAutoSubmit(session.method, session.value);
    }
  }, [currentStep, onAutoSubmit, setFormData, setAutoSubmitted]);

  const handleDisconnect = () => {
    clearContactSession();
    window.location.reload();
  };

  return { handleDisconnect };
};