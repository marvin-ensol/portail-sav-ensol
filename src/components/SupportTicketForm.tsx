import { Card, CardContent } from "@/components/ui/card";
import ProgressIndicator from "./ProgressIndicator";
import StepRenderer from "./StepRenderer";
import TicketFormHeader from "./TicketFormHeader";
import { useHubSpotSearch } from "@/hooks/useHubSpotSearch";
import { useTicketFormState } from "@/hooks/useTicketFormState";
import { useTicketFormHandlers } from "@/hooks/useTicketFormHandlers";
import { useUrlParams } from "@/hooks/useUrlParams";

const SupportTicketForm = () => {
  const {
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
    handleBackFromTicketDetails,
    handleViewTickets,
    handleTicketSubmit,
  } = useTicketFormHandlers({
    searchContact,
    searchTickets,
    searchDeals,
    searchResult,
    deals,
    selectedDeal,
    selectedTicket,
    isSubmittingTicket,
    goToStep,
    resetForm,
    resetSearch,
    setSelectedDeal,
    setSelectedTicket,
    setIsSubmittingTicket,
  });

  // URL parameter detection and auto-population
  useUrlParams({
    onAutoSubmit: handleSubmit,
    setFormData,
    setAutoSubmitted,
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="form-card w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
        <TicketFormHeader 
          currentStep={currentStep}
          searchResult={searchResult}
        />
        
        <CardContent className="space-y-6">
          {/* Progress indicator at top */}
          {currentStep < 5 && currentStep !== 6 && (
            <ProgressIndicator currentStep={currentStep === 6 ? 3 : currentStep} totalSteps={currentStep === 4 ? 4 : 3} />
          )}
          
          {/* Special progress indicator for ticket details */}
          {currentStep === 6 && (
            <ProgressIndicator currentStep={3} totalSteps={3} />
          )}
          
          <StepRenderer
            currentStep={currentStep}
            formData={formData}
            autoSubmitted={autoSubmitted}
            selectedDeal={selectedDeal}
            selectedTicket={selectedTicket}
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
            onBackFromTicketDetails={handleBackFromTicketDetails}
            onTicketSubmit={handleTicketSubmit}
            onViewTickets={handleViewTickets}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketForm;