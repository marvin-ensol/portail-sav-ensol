import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Loader2, CheckCircle, User, AlertCircle, Ticket, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IdentificationMethod = "phone" | "email";

interface FormData {
  method: IdentificationMethod | null;
  value: string;
}

interface TicketData {
  id: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  createdDate: string | null;
  lastModified: string | null;
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
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } else {
      // Auto-focus the input field if no UTM parameters
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
      
      // If contact found, search for tickets
      if (data.found && data.contact) {
        await searchTickets(data.contact.contactId);
      }
      
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

  const searchTickets = async (contactId: string) => {
    setTicketsLoading(true);
    setTickets([]);

    try {
      console.log('Searching tickets for contact ID:', contactId);
      
      const { data, error } = await supabase.functions.invoke('search-hubspot-tickets', {
        body: { contactId }
      });

      console.log('Tickets search response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        return;
      }

      if (data.success && data.tickets) {
        setTickets(data.tickets);
        console.log(`Found ${data.tickets.length} tickets`);
      }
    } catch (error) {
      console.error('Error searching tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketClick = (ticket: TicketData) => {
    // TODO: Navigate to ticket details or handle ticket selection
    console.log('Ticket clicked:', ticket);
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

            {/* Input Field Container - Fixed Height to Prevent Resizing */}
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
          </div>

          {/* Step 2: Search Results */}
          {currentStep === 2 && searchResult && (
            <div className="space-y-6">
              {searchResult.found && searchResult.contact ? (
                <div className="space-y-6">
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

                  {/* Tickets Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">
                      Donner suite à une demande existante
                    </h3>
                    
                    {ticketsLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Recherche de vos demandes...
                        </p>
                      </div>
                    ) : tickets.length > 0 ? (
                      <div className="space-y-3">
                        {tickets.map((ticket) => (
                          <Card 
                            key={ticket.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary"
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Ticket className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                      #{ticket.ticketId}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-foreground mb-1">
                                    {ticket.subject}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>Statut: {ticket.status}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    ticket.priority === 'high' 
                                      ? 'bg-red-100 text-red-800' 
                                      : ticket.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {ticket.priority}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Ticket className="mx-auto h-12 w-12 mb-3 opacity-50" />
                        <p>Aucuns tickets existants</p>
                      </div>
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
                      setTickets([]);
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
          <div className="flex items-center justify-center space-x-2">
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