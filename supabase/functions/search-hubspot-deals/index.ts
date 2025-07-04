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
    const { contactId } = await req.json()

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

    console.log('Fetching deals for contact ID:', contactId)

    // First, get the associations between contact and deals
    const associationsUrl = `${HUBSPOT_BASE_URL}/objects/contacts/${contactId}/associations/deals`
    
    const associationsResponse = await fetch(associationsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!associationsResponse.ok) {
      const errorText = await associationsResponse.text()
      console.error('Failed to fetch deal associations:', errorText)
      return Response.json(
        { success: false, error: 'Failed to fetch deal associations', deals: [] },
        { status: 200, headers: corsHeaders }
      )
    }

    const associationsData = await associationsResponse.json()
    const dealIds = associationsData.results?.map((result: any) => result.id) || []

    console.log('Found deal associations:', dealIds)

    if (dealIds.length === 0) {
      return Response.json(
        { success: true, deals: [] },
        { status: 200, headers: corsHeaders }
      )
    }

    // Batch fetch deals using the batch read API
    const batchUrl = `${HUBSPOT_BASE_URL}/objects/deals/batch/read`
    
    const batchPayload = {
      inputs: dealIds.map((id: string) => ({ id })),
      properties: [
        'dealname',
        'dealstage',
        'amount',
        'closedate',
        'createdate',
        'pipeline',
        'dealtype',
        'address',
        'postcode',
        'date_entered__installation_done_',
        'products',
        'is_quote_signed',
        'hs_is_closed_lost'
      ]
    }

    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchPayload)
    })

    if (!batchResponse.ok) {
      const errorText = await batchResponse.text()
      console.error('Failed to batch fetch deals:', errorText)
      return Response.json(
        { success: false, error: 'Failed to fetch deals', deals: [] },
        { status: 200, headers: corsHeaders }
      )
    }

    const batchData = await batchResponse.json()
    let deals = batchData.results?.map((deal: any) => ({
      id: deal.id,
      dealId: deal.id,
      name: deal.properties.dealname || 'Sans nom',
      stage: deal.properties.dealstage || 'Unknown',
      amount: deal.properties.amount ? `${parseFloat(deal.properties.amount).toLocaleString('fr-FR')} €` : 'N/A',
      closeDate: deal.properties.closedate || null,
      createdDate: deal.properties.createdate || null,
      pipeline: deal.properties.pipeline || 'default',
      dealType: deal.properties.dealtype || null,
      address: deal.properties.address || '',
      postcode: deal.properties.postcode || '',
      dateEnteredInstallationDone: deal.properties.date_entered__installation_done_ || null,
      products: deal.properties.products ? deal.properties.products.split(';') : [],
      isQuoteSigned: deal.properties.is_quote_signed || '0',
      isClosedLost: deal.properties.hs_is_closed_lost || 'false'
    })) || []

    // Filter deals where quote is signed (is_quote_signed = 1) and not closed lost
    deals = deals.filter((deal: any) => deal.isQuoteSigned === '1' && deal.isClosedLost !== 'true')

    // Sort by installation date (most recent first)
    deals.sort((a: any, b: any) => {
      if (!a.dateEnteredInstallationDone && !b.dateEnteredInstallationDone) return 0
      if (!a.dateEnteredInstallationDone) return 1
      if (!b.dateEnteredInstallationDone) return -1
      
      return new Date(b.dateEnteredInstallationDone).getTime() - new Date(a.dateEnteredInstallationDone).getTime()
    })

    console.log(`Successfully fetched ${deals.length} deals`)

    return Response.json(
      { success: true, deals },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in search-hubspot-deals function:', error)
    return Response.json(
      { success: false, error: 'Internal server error', deals: [] },
      { status: 500, headers: corsHeaders }
    )
  }
})