import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Laptop, Loader2, CheckCircle } from "lucide-react";

type IdentificationMethod = "phone" | "email";

interface FormData {
  method: IdentificationMethod | null;
  value: string;
}

const SupportTicketForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: null,
    value: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // UTM parameter detection and auto-population
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const phone = urlParams.get('phone');

    if (email) {
      setFormData({ method: "email", value: email });
      setAutoSubmitted(true);
      handleSubmit("email", email);
    } else if (phone) {
      setFormData({ method: "phone", value: phone });
      setAutoSubmitted(true);
      handleSubmit("phone", phone);
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits for French format
    const limitedDigits = digits.slice(0, 10);
    
    // Format as XX XX XX XX XX
    const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    
    return formatted;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const identificationOptions = [
    {
      id: "phone" as const,
      title: "Numéro de téléphone",
      icon: Phone,
      placeholder: "06 12 34 56 78",
      inputType: "tel",
    },
    {
      id: "email" as const,
      title: "Adresse email",
      icon: Mail,
      placeholder: "votre.email@exemple.com",
      inputType: "email",
    },
  ];

  const handleMethodSelect = (method: IdentificationMethod) => {
    setFormData({ method, value: "" });
  };

  const handleInputChange = (value: string) => {
    let processedValue = value;
    
    // Format phone number if phone method is selected
    if (formData.method === "phone") {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, value: processedValue }));
  };

  const handleSubmit = async (method?: IdentificationMethod, value?: string) => {
    const submitMethod = method || formData.method;
    const submitValue = value || formData.value;
    
    if (!submitMethod || !submitValue.trim()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Here you would normally handle the response
      console.log(`Submitted ${submitMethod}: ${submitValue}`);
    }, 2000);
  };

  const selectedOption = identificationOptions.find(opt => opt.id === formData.method);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-sunset)' }}>
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Support Ensol</CardTitle>
          <CardDescription>
            {autoSubmitted 
              ? "Détection automatique de vos informations..." 
              : "Envoi d'une nouvelle demande"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Method Selection */}
          <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
            {!autoSubmitted && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Comment aimeriez-vous vous identifier ?</h3>
                <div className="grid gap-3">
                  {identificationOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div
                        key={option.id}
                        className={`option-card ${formData.method === option.id ? 'selected' : ''}`}
                        onClick={() => handleMethodSelect(option.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">{option.title}</div>
                          </div>
                          {formData.method === option.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Field */}
            {(formData.method || autoSubmitted) && selectedOption && (
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="identification">
                    Saisissez votre {selectedOption.title.toLowerCase()}
                  </Label>
                  <Input
                    id="identification"
                    type={selectedOption.inputType}
                    placeholder={selectedOption.placeholder}
                    value={formData.value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full"
                    disabled={isLoading || autoSubmitted}
                  />
                </div>

                {!autoSubmitted && (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={
                      !formData.value.trim() || 
                      isLoading || 
                      (formData.method === "phone" && !validatePhoneNumber(formData.value))
                    }
                    variant="sunset"
                    className="w-full"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 loading-spinner" />
                        Vérification...
                      </>
                    ) : (
                      'Continuer'
                    )}
                  </Button>
                )}

                {autoSubmitted && isLoading && (
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 loading-spinner text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Vérification automatique de vos informations...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            <div className="h-2 w-8 bg-primary rounded-full"></div>
            <div className="h-2 w-8 bg-muted rounded-full"></div>
            <div className="h-2 w-8 bg-muted rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;