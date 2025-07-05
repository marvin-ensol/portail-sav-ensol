import { Card, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import ProgressIndicator from "./ProgressIndicator";
import StepRenderer from "./StepRenderer";
import TicketFormHeader from "./TicketFormHeader";
import { useHubSpotSearch } from "@/hooks/useHubSpotSearch";
import { useTicketFormState } from "@/hooks/useTicketFormState";
import { useTicketFormHandlers } from "@/hooks/useTicketFormHandlers";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useContactSession } from "@/hooks/useContactSession";

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

  const {
    handleSubmit,
    handleDealClick,
    handleNewTicket,
    handleTicketClick,
    handleTryAgain,
    handleBackToTickets,
    handleBackToDeals,
    handleViewTickets,
    handleTicketSubmit,
  } = useTicketFormHandlers({
    searchContact,
    searchTickets,
    searchDeals,
    searchResult,
    deals,
    selectedDeal,
    isSubmittingTicket,
    goToStep,
    resetForm,
    resetSearch,
    setSelectedDeal,
    setIsSubmittingTicket,
  });

  // URL parameter detection and auto-population
  useUrlParams({
    onAutoSubmit: handleSubmit,
    setFormData,
    setAutoSubmitted,
  });

  // Contact session management (cookie-based persistence)
  const { handleDisconnect } = useContactSession({
    onAutoSubmit: handleSubmit,
    setFormData,
    setAutoSubmitted,
    currentStep,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <TicketFormHeader 
          currentStep={currentStep}
          searchResult={searchResult}
        />
        
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
      
      {/* Disconnect button - only show when user is logged in (not on step 1) */}
      {currentStep > 1 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleDisconnect}
            className="group flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 px-3 py-1.5 rounded-full hover:-translate-x-4"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="ml-2 w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
              Déconnexion
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SupportTicketForm;