import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Loader2, CheckCircle, User, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IdentificationMethod = "phone" | "email";

interface FormData {
  method: IdentificationMethod | null;
  value: string;
}

const SupportTicketForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: "phone",
    value: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<{found: boolean; contact?: any; message?: string; error?: string} | null>(null);

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

  const commonEmailDomains = [
    'gmail.com',
    'free.fr', 
    'yahoo.fr',
    'live.fr',
    'hotmail.fr',
    'outlook.fr',
    'orange.fr',
    'wanadoo.fr',
    'laposte.net',
    'sfr.fr'
  ];

  const generateEmailSuggestions = (email: string) => {
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) return [];
    
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex + 1).toLowerCase();
    
    if (!domainPart) {
      // Show all domains if no domain typed yet
      return commonEmailDomains.map(domain => `${localPart}@${domain}`);
    }
    
    // Filter domains that start with the typed domain part
    const matchingDomains = commonEmailDomains.filter(domain => 
      domain.toLowerCase().startsWith(domainPart)
    );
    
    return matchingDomains.map(domain => `${localPart}@${domain}`);
  };

  const handleEmailSuggestionSelect = (suggestion: string) => {
    setFormData(prev => ({ ...prev, value: suggestion }));
    setShowEmailSuggestions(false);
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
      setShowEmailSuggestions(false);
    }
    
    // Generate email suggestions if email method is selected
    if (formData.method === "email") {
      const suggestions = generateEmailSuggestions(value);
      setEmailSuggestions(suggestions);
      setShowEmailSuggestions(suggestions.length > 0 && value.includes('@'));
    }
    
    setFormData(prev => ({ ...prev, value: processedValue }));
  };

  const handleSubmit = async (method?: IdentificationMethod, value?: string) => {
    const submitMethod = method || formData.method;
    const submitValue = value || formData.value;
    
    if (!submitMethod || !submitValue.trim()) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      console.log('Starting HubSpot search with:', { method: submitMethod, value: submitValue });
      
      const { data, error } = await supabase.functions.invoke('search-hubspot-contact', {
        body: {
          method: submitMethod,
          value: submitValue
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Search result:', data);
      setSearchResult(data);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error searching contact:', error);
      setSearchResult({
        found: false,
        error: 'Failed to search for contact. Please try again.'
      });
      setCurrentStep(2);
    } finally {
      setIsLoading(false);
    }
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
                
                {/* Tab System */}
                <div className="flex bg-muted rounded-lg p-1 w-full">
                  {identificationOptions.map((option) => {
                    const IconComponent = option.icon;
                    const isActive = formData.method === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleMethodSelect(option.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-background text-foreground shadow-sm border border-border' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm hidden sm:inline">{option.title}</span>
                        <span className="text-sm sm:hidden">
                          {option.id === 'phone' ? 'Téléphone' : 'Email'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Field - Always show when method is selected or auto-submitted */}
            {(formData.method || autoSubmitted) && selectedOption && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identification" className="text-sm font-medium">
                    Saisissez votre {selectedOption.title.toLowerCase()}
                  </Label>
                  <div className="relative">
                    <Input
                      id="identification"
                      type={selectedOption.inputType}
                      placeholder={selectedOption.placeholder}
                      value={formData.value}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="w-full h-12 text-base"
                      disabled={isLoading || autoSubmitted}
                      onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                    />
                    
                    {/* Email suggestions dropdown */}
                    {showEmailSuggestions && formData.method === "email" && (
                      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                        {emailSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border last:border-b-0"
                            onClick={() => handleEmailSuggestionSelect(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!autoSubmitted && (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={
                      !formData.value.trim() || 
                      isLoading || 
                      (formData.method === "phone" && !validatePhoneNumber(formData.value))
                    }
                    className="w-full h-12 text-base font-medium"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      'Continuer'
                    )}
                  </Button>
                )}

                {autoSubmitted && isLoading && (
                  <div className="text-center py-4">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Vérification automatique de vos informations...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Search Results */}
          {currentStep === 2 && searchResult && (
            <div className="space-y-4">
              {searchResult.found && searchResult.contact ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <User className="h-6 w-6" />
                    <span className="text-lg font-semibold">Contact trouvé !</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-xl font-bold text-green-800">
                      {searchResult.contact.fullName}
                    </h3>
                    {searchResult.contact.email && (
                      <p className="text-green-700 mt-1">
                        📧 {searchResult.contact.email}
                      </p>
                    )}
                    {searchResult.contact.phone && (
                      <p className="text-green-700 mt-1">
                        📱 {searchResult.contact.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="text-lg font-semibold">Contact non trouvé</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                      {searchResult.message || searchResult.error || 'Aucun contact trouvé avec les informations fournies.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setCurrentStep(1);
                      setSearchResult(null);
                      setFormData({ method: "phone", value: "" });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Essayer à nouveau
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            <div className={`h-2 w-8 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`h-2 w-8 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="h-2 w-8 bg-muted rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;