import { useState } from "react";
import type { FormData, DealData } from "@/types/hubspot";

export const useTicketFormState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: "phone",
    value: "",
  });
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealData | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({ method: "phone", value: "" });
    setAutoSubmitted(false);
    setSelectedDeal(null);
    setIsSubmittingTicket(false);
  };

  return {
    currentStep,
    formData,
    autoSubmitted,
    selectedDeal,
    isSubmittingTicket,
    setFormData,
    setAutoSubmitted,
    setSelectedDeal,
    setIsSubmittingTicket,
    goToStep,
    resetForm,
  };
};