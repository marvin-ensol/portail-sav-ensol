import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchContactRequest {
  method: 'phone' | 'email';
  value: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, value }: SearchContactRequest = await req.json();
    console.log('Edge function called with:', { method, value });
    
    const accessToken = Deno.env.get('HUBSPOT_ACCESS_TOKEN');
    console.log('Access token available:', !!accessToken);

    if (!accessToken) {
      console.error('HubSpot access token not configured');
      throw new Error('HubSpot access token not configured');
    }

    let searchProperty: string;
    let searchValue: string = value;

    if (method === 'phone') {
      searchProperty = 'mobilephone';
      // Convert French phone number to E.164 format for HubSpot search
      let cleanedPhone = value.replace(/\s/g, '');
      
      // If it's a French mobile number starting with 06, 07 (without +33)
      if (cleanedPhone.match(/^0[67]/)) {
        // Remove leading 0 and add +33
        searchValue = '+33' + cleanedPhone.substring(1);
      } 
      // If it already has +33, use as is
      else if (cleanedPhone.startsWith('+33')) {
        searchValue = cleanedPhone;
      }
      // Otherwise, use the cleaned version
      else {
        searchValue = cleanedPhone;
      }
      
      console.log('Phone search - original:', value, 'E.164 format:', searchValue);
    } else {
      searchProperty = 'email';
      console.log('Email search with:', searchValue);
    }

    console.log(`Searching HubSpot for ${method} using property ${searchProperty}: ${searchValue}`);

    // Search for contact using HubSpot Search API
    const searchPayload = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: searchProperty,
              operator: 'EQ',
              value: searchValue
            }
          ]
        }
      ],
      properties: ['firstname', 'lastname', 'email', 'mobilephone'],
      limit: 1
    };
    
    console.log('HubSpot API request payload:', JSON.stringify(searchPayload, null, 2));
    
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload)
    });

    console.log('HubSpot API response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('HubSpot API error response:', errorText);
      throw new Error(`HubSpot API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('HubSpot search results:', JSON.stringify(searchData, null, 2));
    console.log('Number of results found:', searchData.results?.length || 0);

    if (searchData.results && searchData.results.length > 0) {
      const contact = searchData.results[0];
      const firstName = contact.properties.firstname || '';
      const lastName = contact.properties.lastname || '';
      const fullName = `${firstName} ${lastName}`.trim();

      return new Response(JSON.stringify({
        found: true,
        contact: {
          contactId: contact.id,
          id: contact.id,
          fullName: fullName || 'Contact',
          firstname: contact.properties.firstname || '',
          email: contact.properties.email || '',
          phone: contact.properties.mobilephone || ''
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        found: false,
        message: `Aucun client trouvé avec ${method === 'phone' ? 'le numéro fourni' : 'l\'adresse email fournie'}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in search-hubspot-contact function:', error);
    return new Response(
      JSON.stringify({ 
        found: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});