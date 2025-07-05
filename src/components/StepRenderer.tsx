import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Check } from "lucide-react";
import ContactSearch from "./ContactSearch";
import TicketsList from "./TicketsList";
import DealsList from "./DealsList";
import TicketCreationForm from "./TicketCreationForm";
import type { FormData, IdentificationMethod, TicketData, DealData, SearchResult } from "@/types/hubspot";

interface StepRendererProps {
  currentStep: number;
  formData: FormData;
  autoSubmitted: boolean;
  selectedDeal: DealData | null;
  isSubmittingTicket: boolean;
  searchResult: SearchResult | null;
  tickets: TicketData[];
  ticketsLoading: boolean;
  deals: DealData[];
  dealsLoading: boolean;
  isLoading: boolean;
  onSubmit: (method: IdentificationMethod, value: string) => void;
  onNewTicket: () => void;
  onTicketClick: (ticket: TicketData) => void;
  onDealClick: (deal: DealData) => void;
  onBackToTickets: () => void;
  onBackToDeals: () => void;
  onTicketSubmit: (subject: string, description: string, files: File[]) => void;
  onViewTickets: () => void;
  onSkipAutoVerification?: () => void;
}

const StepRenderer = ({
  currentStep,
  formData,
  autoSubmitted,
  selectedDeal,
  isSubmittingTicket,
  searchResult,
  tickets,
  ticketsLoading,
  deals,
  dealsLoading,
  isLoading,
  onSubmit,
  onNewTicket,
  onTicketClick,
  onDealClick,
  onBackToTickets,
  onBackToDeals,
  onTicketSubmit,
  onViewTickets,
  onSkipAutoVerification,
}: StepRendererProps) => {
  return (
    <>
      {/* Step 1: Contact Search */}
      <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
        {currentStep === 1 && (
          <ContactSearch
            onSubmit={onSubmit}
            isLoading={isLoading}
            autoSubmitted={autoSubmitted}
            initialFormData={formData}
            searchResult={searchResult}
            onSkipAutoVerification={onSkipAutoVerification}
          />
        )}
      </div>

      {/* Step 2: Tickets List */}
      {currentStep === 2 && searchResult?.found && (
        <>
          <TicketsList
            tickets={tickets}
            isLoading={ticketsLoading}
            onTicketClick={onTicketClick}
          />
          
          {/* New Ticket Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={onNewTicket}
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
            onDealClick={onDealClick}
          />
          
          {/* Back Button - only show if there are tickets to go back to */}
          {tickets.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={onBackToTickets}
                className="w-full h-12 text-base font-medium"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Retour
              </Button>
            </div>
          )}
        </>
      )}

      {/* Step 4: Ticket Creation Form */}
      {currentStep === 4 && (
        <TicketCreationForm
          deal={selectedDeal || undefined}
          onSubmit={onTicketSubmit}
          onBack={selectedDeal ? onBackToDeals : onBackToTickets}
          isSubmitting={isSubmittingTicket}
        />
      )}

      {/* Step 5: Success Page */}
      {currentStep === 5 && (
        <div className="text-center space-y-6">
          <div className="text-green-600">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-scale-in transition-all duration-500 delay-200">
              <Check className="w-8 h-8 animate-fade-in transition-all duration-700 delay-500" strokeWidth={3} />
            </div>
          </div>
          
          <Button
            onClick={onViewTickets}
            className="w-full h-12 text-base font-medium mt-6"
          >
            Voir mes demandes
          </Button>
        </div>
      )}
    </>
  );
};

export default StepRenderer;