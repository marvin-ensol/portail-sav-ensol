import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressIndicator from "./ProgressIndicator";
import StepRenderer from "./StepRenderer";
import { useHubSpotSearch } from "@/hooks/useHubSpotSearch";
import { useTicketFormState } from "@/hooks/useTicketFormState";
import { useUrlParams } from "@/hooks/useUrlParams";
import { supabase } from "@/integrations/supabase/client";
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
      const [foundTickets, foundDeals] = await Promise.all([
        searchTickets(result.contact.contactId),
        searchDeals(result.contact.contactId)
      ]);
      
      // If no tickets found, check deals
      if (foundTickets.length > 0) {
        goToStep(2); // Go to tickets list
      } else if (foundDeals && foundDeals.length > 0) {
        goToStep(3); // Go to deals selection
      } else {
        // No tickets and no deals - go directly to ticket creation form
        goToStep(4);
      }
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
    // If no deals found, skip directly to ticket creation form
    if (deals.length === 0) {
      goToStep(4);
    } else {
      goToStep(3);
    }
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

  const handleViewTickets = () => {
    goToStep(2);
  };

  const handleTicketSubmit = async (description: string, files: File[]) => {
    setIsSubmittingTicket(true);
    try {
      if (!searchResult?.contact?.contactId) {
        console.error('No contact ID available');
        return;
      }

      console.log('Creating ticket:', { 
        contactId: searchResult.contact.contactId,
        dealId: selectedDeal?.dealId,
        description, 
        files 
      });
      
      const { data, error } = await supabase.functions.invoke('create-hubspot-ticket', {
        body: {
          contactId: searchResult.contact.contactId,
          dealId: selectedDeal?.dealId || null,
          description
        }
      });

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      if (data?.success) {
        console.log('Ticket created successfully:', data.ticket);
        // Go to success page instead of resetting
        goToStep(5);
      } else {
        throw new Error(data?.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f7ff' }}>
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
           <CardTitle className="text-2xl font-bold gradient-text">
            {currentStep === 2 && searchResult?.found && searchResult.contact?.firstname 
              ? `Bonjour, ${searchResult.contact.firstname}` 
              : currentStep === 5
              ? "Demande envoyée"
              : "Support Ensol"
            }
          </CardTitle>
          <CardDescription>
            {currentStep === 3 
              ? "Envoi d'une nouvelle demande"
              : currentStep === 4
              ? "Envoi d'une nouvelle demande"
              : currentStep === 5
              ? "Notre équipe étudie votre demande et vous contactera dans les plus brefs délais"
              : "Suivi de vos demandes d'assistance"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator at top */}
          {currentStep < 5 && (
            <ProgressIndicator currentStep={currentStep} totalSteps={currentStep === 4 ? 4 : 3} />
          )}
          
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
            onViewTickets={handleViewTickets}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;