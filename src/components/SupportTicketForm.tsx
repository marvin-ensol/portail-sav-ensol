import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressIndicator from "./ProgressIndicator";
import StepRenderer from "./StepRenderer";
import { useHubSpotSearch } from "@/hooks/useHubSpotSearch";
import { useTicketFormState } from "@/hooks/useTicketFormState";
import { useUrlParams } from "@/hooks/useUrlParams";
import type { IdentificationMethod, TicketData, DealData } from "@/types/hubspot";

const SupportTicketForm = () => {
  const {
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
  } = useTicketFormState();

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

  const handleSubmit = async (method: IdentificationMethod, value: string) => {
    const result = await searchContact(method, value);
    
    // If contact found, search for tickets and deals
    if (result?.found && result.contact) {
      const [foundTickets] = await Promise.all([
        searchTickets(result.contact.contactId),
        searchDeals(result.contact.contactId)
      ]);
      
      // If no tickets found, skip directly to deals selection (step 3)
      // Otherwise go to tickets list (step 2)
      goToStep(foundTickets.length > 0 ? 2 : 3);
    }
  };

  // URL parameter detection and auto-population
  useUrlParams({
    onAutoSubmit: handleSubmit,
    setFormData,
    setAutoSubmitted,
  });

  const handleDealClick = (deal: DealData) => {
    setSelectedDeal(deal);
    goToStep(4);
  };

  const handleNewTicket = () => {
    goToStep(3);
  };

  const handleTicketClick = (ticket: TicketData) => {
    // TODO: Navigate to ticket details or handle ticket selection
    console.log('Ticket clicked:', ticket);
  };

  const handleTryAgain = () => {
    resetForm();
    resetSearch();
  };

  const handleBackToTickets = () => {
    goToStep(2);
  };

  const handleBackToDeals = () => {
    setSelectedDeal(null);
    goToStep(3);
  };

  const handleTicketSubmit = async (description: string, files: File[]) => {
    setIsSubmittingTicket(true);
    try {
      // TODO: Implement ticket creation API call
      console.log('Creating ticket:', { description, files, deal: selectedDeal });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset to initial state
      resetForm();
      resetSearch();
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f7ff' }}>
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
           <CardTitle className="text-2xl font-bold gradient-text">
            {(currentStep === 2 || currentStep === 3) && searchResult?.found && searchResult.contact?.firstname 
              ? `Bonjour, ${searchResult.contact.firstname}` 
              : "Support Ensol"
            }
          </CardTitle>
          <CardDescription>
            {currentStep === 3 
              ? "Envoi d'une nouvelle demande"
              : currentStep === 4
              ? "Envoi d'une nouvelle demande"
              : "Suivi de vos demandes d'assistance"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator at top */}
          <ProgressIndicator currentStep={currentStep} totalSteps={currentStep === 4 ? 4 : 3} />
          
          <StepRenderer
            currentStep={currentStep}
            formData={formData}
            autoSubmitted={autoSubmitted}
            selectedDeal={selectedDeal}
            isSubmittingTicket={isSubmittingTicket}
            searchResult={searchResult}
            tickets={tickets}
            ticketsLoading={ticketsLoading}
            deals={deals}
            dealsLoading={dealsLoading}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onNewTicket={handleNewTicket}
            onTicketClick={handleTicketClick}
            onDealClick={handleDealClick}
            onBackToTickets={handleBackToTickets}
            onBackToDeals={handleBackToDeals}
            onTicketSubmit={handleTicketSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;