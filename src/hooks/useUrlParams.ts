import { useEffect } from "react";
import type { IdentificationMethod } from "@/types/hubspot";

interface UseUrlParamsProps {
  onAutoSubmit: (method: IdentificationMethod, value: string) => void;
  setFormData: (data: { method: IdentificationMethod; value: string }) => void;
  setAutoSubmitted: (submitted: boolean) => void;
}

export const useUrlParams = ({ onAutoSubmit, setFormData, setAutoSubmitted }: UseUrlParamsProps) => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const phone = urlParams.get('phone');

    if (email) {
      setFormData({ method: "email", value: email });
      setAutoSubmitted(true);
      onAutoSubmit("email", email);
    } else if (phone) {
      setFormData({ method: "phone", value: phone });
      setAutoSubmitted(true);
      onAutoSubmit("phone", phone);
    }
  }, [onAutoSubmit, setFormData, setAutoSubmitted]);
};