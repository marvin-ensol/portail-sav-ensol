import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HUBSPOT_BASE_URL = "https://api.hubapi.com/crm/v3"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contactId, dealId, description } = await req.json()

    if (!contactId) {
      return Response.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const accessToken = Deno.env.get('HUBSPOT_ACCESS_TOKEN')
    if (!accessToken) {
      console.error('HUBSPOT_ACCESS_TOKEN not found')
      return Response.json(
        { success: false, error: 'HubSpot access token not configured' },
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('Creating ticket for contact:', contactId, 'deal:', dealId)

    // Create the ticket
    const ticketData = {
      properties: {
        hs_pipeline_stage: '1',
        subject: 'Ticket'
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 16 }] // Contact to Ticket
        }
      ]
    }

    // Add deal association if provided
    if (dealId) {
      ticketData.associations.push({
        to: { id: dealId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 28 }] // Deal to Ticket
      })
    }

    const createTicketResponse = await fetch(`${HUBSPOT_BASE_URL}/objects/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    })

    if (!createTicketResponse.ok) {
      const errorText = await createTicketResponse.text()
      console.error('Failed to create ticket. Status:', createTicketResponse.status)
      console.error('Error response:', errorText)
      console.error('Request data was:', JSON.stringify(ticketData, null, 2))
      return Response.json(
        { success: false, error: `Failed to create ticket: ${createTicketResponse.status} - ${errorText}` },
        { status: 500, headers: corsHeaders }
      )
    }

    const ticketResult = await createTicketResponse.json()
    const ticketId = ticketResult.id

    console.log('Ticket created successfully with ID:', ticketId)

    return Response.json(
      { 
        success: true, 
        ticket: {
          id: ticketId,
          subject: 'Ticket'
        }
      },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in create-hubspot-ticket function:', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})