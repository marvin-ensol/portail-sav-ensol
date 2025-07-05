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

    // Fetch attachment details individually (no batch endpoint available)
    console.log('Fetching attachment details for IDs:', attachmentIds);

    const attachmentPromises = attachmentIds.map(async (attachmentId: string) => {
      const attachmentUrl = `https://api.hubapi.com/files/v3/files/${attachmentId}`;
      
      try {
        console.log(`Fetching attachment ${attachmentId} from URL: ${attachmentUrl}`);
        
        const response = await fetch(attachmentUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${hubspotAccessToken}`,
            'Content-Type': 'application/json',
          }
        });

        console.log(`Response for attachment ${attachmentId}: status=${response.status}, content-type=${response.headers.get('content-type')}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch attachment ${attachmentId}:`, response.status, errorText);
          return null;
        }

        const responseText = await response.text();
        console.log(`Raw response for attachment ${attachmentId}:`, responseText.substring(0, 200) + '...');
        
        try {
          const data = JSON.parse(responseText);
          console.log(`Successfully parsed JSON for attachment ${attachmentId}:`, data);
          return data;
        } catch (parseError) {
          console.error(`Failed to parse JSON for attachment ${attachmentId}:`, parseError);
          console.error(`Response was:`, responseText.substring(0, 500));
          return null;
        }
      } catch (error) {
        console.error(`Error fetching attachment ${attachmentId}:`, error);
        return null;
      }
    });

    const attachmentResults = await Promise.all(attachmentPromises);
    const attachments = attachmentResults.filter(result => result !== null);
    console.log(`Found ${attachments.length} attachments`);

    // Format and filter attachments - only include valid photo attachments with URLs
    const photoAttachments = attachments
      .filter((attachment: any) => {
        // First check if attachment has a valid URL
        const hasValidUrl = attachment.url && typeof attachment.url === 'string' && attachment.url.trim() !== '';
        if (!hasValidUrl) {
          console.log(`Skipping attachment ${attachment.id}: no valid URL`);
          return false;
        }
        
        // Then check if it's a photo format
        const extension = attachment.extension?.toLowerCase() || '';
        const type = attachment.type?.toLowerCase() || '';
        const isPhoto = ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(extension) ||
                        type.startsWith('image/');
        
        console.log(`Attachment ${attachment.id}: url="${attachment.url}", extension="${extension}", type="${type}", isPhoto=${isPhoto}`);
        return isPhoto;
      })
      .map((attachment: any) => ({
        id: attachment.id,
        name: attachment.name || 'Untitled',
        extension: attachment.extension || '',
        type: attachment.type || '',
        size: attachment.size || 0,
        url: attachment.url,
        createdAt: attachment.created_at || null,
      }));

    console.log(`Filtered to ${photoAttachments.length} valid photo attachments with URLs`);

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