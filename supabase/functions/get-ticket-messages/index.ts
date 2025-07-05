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
    const { ticketId } = await req.json();
    console.log('Fetching messages for ticket ID:', ticketId);

    if (!ticketId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ticket ID is required' 
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

    // Step 1: Get associated email engagement IDs
    const associationsUrl = `https://api.hubapi.com/crm/v4/objects/tickets/${ticketId}/associations/email`;
    
    console.log('Getting email associations for ticket:', ticketId);

    const associationsResponse = await fetch(associationsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const associationsData = await associationsResponse.json();
    console.log('HubSpot associations response:', associationsData);

    if (!associationsResponse.ok) {
      console.error('HubSpot associations API error:', associationsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get email associations from HubSpot',
          details: associationsData
        }),
        { 
          status: associationsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailIds = associationsData.results?.map((assoc: any) => assoc.toObjectId) || [];
    console.log('Found associated email IDs:', emailIds);

    if (emailIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          messages: [],
          count: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Batch read email details
    const emailDetailsUrl = 'https://api.hubapi.com/crm/v3/objects/emails/batch/read';
    const emailDetailsBody = {
      inputs: emailIds.map((id: string) => ({ id })),
      properties: [
        "hs_timestamp",
        "hs_email_text", 
        "hs_email_direction",
        "hs_email_subject"
      ]
    };

    console.log('Fetching email details for IDs:', emailIds);

    const emailDetailsResponse = await fetch(emailDetailsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailDetailsBody)
    });

    const emailDetailsData = await emailDetailsResponse.json();
    console.log('HubSpot email details response:', emailDetailsData);

    if (!emailDetailsResponse.ok) {
      console.error('HubSpot email details API error:', emailDetailsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get email details from HubSpot',
          details: emailDetailsData
        }),
        { 
          status: emailDetailsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emails = emailDetailsData.results || [];
    console.log(`Found ${emails.length} emails for ticket ${ticketId}`);

    // Format and sort messages chronologically
    const formattedMessages = emails
      .map((email: any) => ({
        id: email.id,
        timestamp: email.properties?.hs_timestamp || null,
        text: email.properties?.hs_email_text || '',
        direction: email.properties?.hs_email_direction || 'UNKNOWN',
        subject: email.properties?.hs_email_subject || '',
        isClient: email.properties?.hs_email_direction === 'INCOMING_EMAIL',
        isEnsol: email.properties?.hs_email_direction === 'EMAIL'
      }))
      .filter((message: any) => message.isClient || message.isEnsol) // Only show client and Ensol messages
      .sort((a: any, b: any) => {
        // Sort by timestamp chronologically (oldest first)
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: formattedMessages,
        count: formattedMessages.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-ticket-messages function:', error);
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