import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, Loader2, AlertCircle } from "lucide-react";

type IdentificationMethod = "phone" | "email";

interface FormData {
  method: IdentificationMethod | null;
  value: string;
}

interface SearchResult {
  found: boolean;
  contact?: any;
  message?: string;
  error?: string;
}

interface ContactSearchProps {
  onSubmit: (method: IdentificationMethod, value: string) => void;
  isLoading: boolean;
  autoSubmitted: boolean;
  initialFormData?: FormData;
  searchResult?: SearchResult | null;
}

const ContactSearch = ({ onSubmit, isLoading, autoSubmitted, initialFormData, searchResult }: ContactSearchProps) => {
  const [formData, setFormData] = useState<FormData>(
    initialFormData || { method: "phone", value: "" }
  );
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const identificationOptions = [
    {
      id: "phone" as const,
      title: "Num. de mobile",
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

  // Auto-focus input when no UTM parameters
  useEffect(() => {
    if (!autoSubmitted) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoSubmitted]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);
    const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    return formatted;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const generateEmailSuggestions = (email: string) => {
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) return [];
    
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex + 1).toLowerCase();
    
    if (!domainPart) {
      return commonEmailDomains.map(domain => `${localPart}@${domain}`);
    }
    
    const matchingDomains = commonEmailDomains.filter(domain => 
      domain.toLowerCase().startsWith(domainPart)
    );
    
    return matchingDomains.map(domain => `${localPart}@${domain}`);
  };

  const handleMethodSelect = (method: IdentificationMethod) => {
    setFormData({ method, value: "" });
    setShowEmailSuggestions(false);
  };

  const handleInputChange = (value: string) => {
    let processedValue = value;
    
    if (formData.method === "phone") {
      processedValue = formatPhoneNumber(value);
      setShowEmailSuggestions(false);
    }
    
    if (formData.method === "email") {
      const suggestions = generateEmailSuggestions(value);
      setEmailSuggestions(suggestions);
      setShowEmailSuggestions(suggestions.length > 0 && value.includes('@'));
    }
    
    setFormData(prev => ({ ...prev, value: processedValue }));
  };

  const handleEmailSuggestionSelect = (suggestion: string) => {
    setFormData(prev => ({ ...prev, value: suggestion }));
    setShowEmailSuggestions(false);
  };

  const handleSubmit = () => {
    if (!formData.method || !formData.value.trim()) return;
    onSubmit(formData.method, formData.value);
  };

  const selectedOption = identificationOptions.find(opt => opt.id === formData.method);
  const showError = searchResult && !searchResult.found && !isLoading;

  return (
    <div className="space-y-6">
      {!autoSubmitted && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Comment aimeriez-vous vous identifier ?</h3>
          
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
                    {option.id === 'phone' ? 'Num. de mobile' : 'Email'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Field Container */}
      <div className="min-h-[120px] flex flex-col justify-start mt-6">
        {(formData.method || autoSubmitted) && selectedOption && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                id="identification"
                type={selectedOption.inputType}
                placeholder={selectedOption.placeholder}
                value={formData.value}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full h-12 text-base ${showError ? 'border-red-500 focus:border-red-500' : ''}`}
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

            {/* Error message below input */}
            {showError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {searchResult.message || searchResult.error || 'Aucun contact trouvé avec les informations fournies.'}
                </span>
              </div>
            )}

            {!autoSubmitted && (
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.value.trim() || 
                  isLoading || 
                  (formData.method === "phone" && !validatePhoneNumber(formData.value))
                }
                className="w-full h-12 text-base font-medium"
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
    </div>
  );
};

export default ContactSearch;