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
    const { attachmentIds } = await req.json();
    console.log('Fetching attachments for IDs:', attachmentIds);

    if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          attachments: []
        }),
        { 
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

    // Batch read attachment details
    const attachmentDetailsUrl = 'https://api.hubapi.com/filemanager/api/v3/files/batch/read';
    const attachmentDetailsBody = {
      inputs: attachmentIds.map((id: string) => ({ id })),
      properties: [
        "name",
        "extension", 
        "type",
        "size",
        "url",
        "created_at"
      ]
    };

    console.log('Fetching attachment details for IDs:', attachmentIds);

    const attachmentDetailsResponse = await fetch(attachmentDetailsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attachmentDetailsBody)
    });

    const attachmentDetailsData = await attachmentDetailsResponse.json();
    console.log('HubSpot attachment details response:', attachmentDetailsData);

    if (!attachmentDetailsResponse.ok) {
      console.error('HubSpot attachment details API error:', attachmentDetailsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get attachment details from HubSpot',
          details: attachmentDetailsData
        }),
        { 
          status: attachmentDetailsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const attachments = attachmentDetailsData.results || [];
    console.log(`Found ${attachments.length} attachments`);

    // Filter for photo files only and format the data
    const photoAttachments = attachments
      .filter((attachment: any) => {
        const extension = attachment.properties?.extension?.toLowerCase() || '';
        const type = attachment.properties?.type?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension) ||
               type.startsWith('image/');
      })
      .map((attachment: any) => ({
        id: attachment.id,
        name: attachment.properties?.name || 'Untitled',
        extension: attachment.properties?.extension || '',
        type: attachment.properties?.type || '',
        size: attachment.properties?.size || 0,
        url: attachment.properties?.url || '',
        createdAt: attachment.properties?.created_at || null
      }));

    console.log(`Filtered to ${photoAttachments.length} photo attachments`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        attachments: photoAttachments,
        count: photoAttachments.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-hubspot-attachments function:', error);
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