import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ContactSearch from "./ContactSearch";
import TicketsList from "./TicketsList";
import ProgressIndicator from "./ProgressIndicator";

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

interface ContactData {
  contactId: string;
  fullName: string;
  firstname?: string;
  email?: string;
  phone?: string;
}

interface SearchResult {
  found: boolean;
  contact?: ContactData;
  message?: string;
  error?: string;
}

const SupportTicketForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: "phone",
    value: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

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

  const handleSubmit = async (method: IdentificationMethod, value: string) => {
    if (!method || !value.trim()) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      console.log('Starting HubSpot search with:', { method, value });
      
      const { data, error } = await supabase.functions.invoke('search-hubspot-contact', {
        body: {
          method,
          value
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Search result:', data);
      setSearchResult(data);
      
      // If contact found, search for tickets and go to step 2
      if (data.found && data.contact) {
        await searchTickets(data.contact.contactId);
        setCurrentStep(2);
      } else {
        // If contact not found, stay on step 1 to show error inline
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error searching contact:', error);
      setSearchResult({
        found: false,
        error: 'Failed to search for contact. Please try again.'
      });
      setCurrentStep(1);
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

  const handleTryAgain = () => {
    setCurrentStep(1);
    setSearchResult(null);
    setTickets([]);
    setFormData({ method: "phone", value: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f7ff' }}>
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center" style={{ background: 'var(--gradient-header)' }}>
          <CardTitle className="text-2xl font-bold text-white">
            {currentStep === 2 && searchResult?.found && searchResult.contact?.firstname 
              ? `Bonjour, ${searchResult.contact.firstname}` 
              : "Support Ensol"
            }
          </CardTitle>
          <CardDescription className="text-white/90">
            {currentStep === 2 && searchResult?.found 
              ? "Choisissez une demande existante"
              : autoSubmitted 
                ? "Détection automatique de vos informations..." 
                : "Envoi d'une nouvelle demande"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator at top */}
          <ProgressIndicator currentStep={currentStep} />
          
          {/* Step 1: Contact Search */}
          <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
            {currentStep === 1 && (
              <ContactSearch
                onSubmit={handleSubmit}
                isLoading={isLoading}
                autoSubmitted={autoSubmitted}
                initialFormData={formData}
                searchResult={searchResult}
              />
            )}
          </div>

          {/* Step 2: Tickets List */}
          {currentStep === 2 && searchResult?.found && (
            <TicketsList
              tickets={tickets}
              isLoading={ticketsLoading}
              onTicketClick={handleTicketClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;