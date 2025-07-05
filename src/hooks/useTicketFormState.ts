import { useState } from "react";
import type { FormData, DealData, TicketData } from "@/types/hubspot";

export const useTicketFormState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: "phone",
    value: "",
  });
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
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
    setSelectedTicket(null);
    setIsSubmittingTicket(false);
  };

  return {
    currentStep,
    formData,
    autoSubmitted,
    selectedDeal,
    selectedTicket,
    isSubmittingTicket,
    setFormData,
    setAutoSubmitted,
    setSelectedDeal,
    setSelectedTicket,
    setIsSubmittingTicket,
    goToStep,
    resetForm,
  };
};