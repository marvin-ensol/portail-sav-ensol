import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactId } = await req.json();
    console.log('Searching tickets for contact ID:', contactId);

    if (!contactId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Contact ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const hubspotAccessToken = Deno.env.get('HUBSPOT_ACCESS_TOKEN');
    if (!hubspotAccessToken) {
      console.error('HUBSPOT_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'HubSpot access token not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Search for tickets associated with the contact using associations API
    const ticketsUrl = `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/ticket`;
    
    console.log('Searching tickets associated with contact:', contactId);

    const ticketsResponse = await fetch(ticketsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const associationsData = await ticketsResponse.json();
    console.log('HubSpot associations response:', associationsData);

    if (!ticketsResponse.ok) {
      console.error('HubSpot associations API error:', associationsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get ticket associations from HubSpot',
          details: associationsData
        }),
        { 
          status: ticketsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ticketIds = associationsData.results?.map((assoc: any) => assoc.toObjectId) || [];
    console.log('Found associated ticket IDs:', ticketIds);

    if (ticketIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          tickets: [],
          count: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Now get the ticket details using the IDs
    const ticketDetailsUrl = 'https://api.hubapi.com/crm/v3/objects/tickets/batch/read';
    const ticketDetailsBody = {
      inputs: ticketIds.map((id: string) => ({ id })),
      properties: [
        "hs_ticket_id",
        "subject", 
        "hs_pipeline_stage",
        "hs_ticket_priority",
        "createdate",
        "hs_lastmodifieddate"
      ]
    };

    console.log('Fetching ticket details for IDs:', ticketIds);

    const ticketDetailsResponse = await fetch(ticketDetailsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketDetailsBody)
    });

    const ticketDetailsData = await ticketDetailsResponse.json();
    console.log('HubSpot ticket details response:', ticketDetailsData);

    if (!ticketDetailsResponse.ok) {
      console.error('HubSpot ticket details API error:', ticketDetailsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get ticket details from HubSpot',
          details: ticketDetailsData
        }),
        { 
          status: ticketDetailsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tickets = ticketDetailsData.results || [];
    console.log(`Found ${tickets.length} tickets for contact ${contactId}`);

    // Format tickets for the frontend
    const formattedTickets = tickets.map((ticket: any) => ({
      id: ticket.id,
      ticketId: ticket.properties?.hs_ticket_id || ticket.id,
      subject: ticket.properties?.subject || 'Sans titre',
      status: ticket.properties?.hs_pipeline_stage || 'unknown',
      priority: ticket.properties?.hs_ticket_priority || 'medium',
      createdDate: ticket.properties?.createdate || null,
      lastModified: ticket.properties?.hs_lastmodifieddate || null
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        tickets: formattedTickets,
        count: formattedTickets.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in search-hubspot-tickets function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});