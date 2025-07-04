import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IdentificationMethod, SearchResult, TicketData, DealData } from "@/types/hubspot";

export const useHubSpotSearch = () => {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchContact = async (method: IdentificationMethod, value: string) => {
    if (!method || !value.trim()) return null;

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
      return data;
    } catch (error) {
      console.error('Error searching contact:', error);
      const errorResult = {
        found: false,
        error: 'Failed to search for contact. Please try again.'
      };
      setSearchResult(errorResult);
      return errorResult;
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
        return [];
      }

      if (data.success && data.tickets) {
        setTickets(data.tickets);
        console.log(`Found ${data.tickets.length} tickets`);
        return data.tickets;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    } finally {
      setTicketsLoading(false);
    }
  };

  const searchDeals = async (contactId: string) => {
    setDealsLoading(true);
    setDeals([]);

    try {
      console.log('Searching deals for contact ID:', contactId);
      
      const { data, error } = await supabase.functions.invoke('search-hubspot-deals', {
        body: { contactId }
      });

      console.log('Deals search response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        return;
      }

      if (data.success && data.deals) {
        setDeals(data.deals);
        console.log(`Found ${data.deals.length} deals`);
      }
    } catch (error) {
      console.error('Error searching deals:', error);
    } finally {
      setDealsLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchResult(null);
    setTickets([]);
    setDeals([]);
  };

  return {
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
  };
};