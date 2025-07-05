import { supabase } from "@/integrations/supabase/client";
import type { IdentificationMethod, DealData, TicketData } from "@/types/hubspot";

interface UseTicketFormHandlersProps {
  searchContact: (method: IdentificationMethod, value: string) => Promise<any>;
  searchTickets: (contactId: string) => Promise<any>;
  searchDeals: (contactId: string) => Promise<any>;
  searchResult: any;
  deals: DealData[];
  selectedDeal: DealData | null;
  isSubmittingTicket: boolean;
  goToStep: (step: number) => void;
  resetForm: () => void;
  resetSearch: () => void;
  setSelectedDeal: (deal: DealData | null) => void;
  setIsSubmittingTicket: (submitting: boolean) => void;
}

export const useTicketFormHandlers = ({
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
}: UseTicketFormHandlersProps) => {
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

  const handleViewTickets = async () => {
    // Refresh tickets before showing them
    if (searchResult?.contact?.contactId) {
      await searchTickets(searchResult.contact.contactId);
    }
    goToStep(2);
  };

  const handleTicketSubmit = async (subject: string, description: string, files: File[]) => {
    setIsSubmittingTicket(true);
    try {
      if (!searchResult?.contact?.contactId) {
        console.error('No contact ID available');
        return;
      }

      console.log('Creating ticket:', { 
        contactId: searchResult.contact.contactId,
        dealId: selectedDeal?.dealId,
        subject,
        description, 
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // Convert files to base64 for transfer
      const filesWithContent = await Promise.all(
        files.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]; // Remove data:mime;base64, prefix
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                content: base64
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );
      
      const { data, error } = await supabase.functions.invoke('create-hubspot-ticket', {
        body: {
          contactId: searchResult.contact.contactId,
          dealId: selectedDeal?.dealId || null,
          subject,
          description,
          files: filesWithContent
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

  return {
    handleSubmit,
    handleDealClick,
    handleNewTicket,
    handleTicketClick,
    handleTryAgain,
    handleBackToTickets,
    handleBackToDeals,
    handleViewTickets,
    handleTicketSubmit,
  };
};