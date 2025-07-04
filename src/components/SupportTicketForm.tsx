import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import ContactSearch from "./ContactSearch";
import TicketsList from "./TicketsList";
import DealsList from "./DealsList";
import ProgressIndicator from "./ProgressIndicator";
import { useHubSpotSearch } from "@/hooks/useHubSpotSearch";
import type { FormData, IdentificationMethod, TicketData, DealData } from "@/types/hubspot";

const SupportTicketForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    method: "phone",
    value: "",
  });
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const {
    searchResult,
    tickets,
    ticketsLoading,
    deals,
    dealsLoading,
    isLoading,
    searchContact,
    searchTickets,
    searchDeals,
    resetSearch
  } = useHubSpotSearch();

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
    const result = await searchContact(method, value);
    
    // If contact found, search for tickets and deals, then go to step 2
    if (result?.found && result.contact) {
      await Promise.all([
        searchTickets(result.contact.contactId),
        searchDeals(result.contact.contactId)
      ]);
      setCurrentStep(2);
    } else {
      // If contact not found, stay on step 1 to show error inline
      setCurrentStep(1);
    }
  };

  const handleDealClick = (deal: DealData) => {
    // TODO: Navigate to deal details or handle deal selection
    console.log('Deal clicked:', deal);
  };

  const handleNewTicket = () => {
    // Go to step 3 to select installation/deal
    setCurrentStep(3);
  };

  const handleTicketClick = (ticket: TicketData) => {
    // TODO: Navigate to ticket details or handle ticket selection
    console.log('Ticket clicked:', ticket);
  };

  const handleTryAgain = () => {
    setCurrentStep(1);
    resetSearch();
    setFormData({ method: "phone", value: "" });
  };

  const handleBackToTickets = () => {
    setCurrentStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f7ff' }}>
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold gradient-text">
            {currentStep === 2 && searchResult?.found && searchResult.contact?.firstname 
              ? `Bonjour, ${searchResult.contact.firstname}` 
              : "Support Ensol"
            }
          </CardTitle>
          <CardDescription>
            {currentStep === 3 
              ? "Envoi d'une nouvelle demande"
              : "Suivi de vos demandes d'assistance"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator at top */}
          <ProgressIndicator currentStep={currentStep} totalSteps={3} />
          
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
            <>
              <TicketsList
                tickets={tickets}
                isLoading={ticketsLoading}
                onTicketClick={handleTicketClick}
              />
              
              {/* New Ticket Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleNewTicket}
                  className="w-full h-12 text-base font-medium"
                  variant="outline"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nouvelle demande
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Deals List */}
          {currentStep === 3 && searchResult?.found && (
            <>
              <DealsList
                deals={deals}
                isLoading={dealsLoading}
                onDealClick={handleDealClick}
              />
              
              {/* Back Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleBackToTickets}
                  className="w-full h-12 text-base font-medium"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Retour
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;