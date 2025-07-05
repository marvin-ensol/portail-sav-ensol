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
    const { contactId, dealId, subject, description, files } = await req.json()

    if (!contactId || !subject || !description) {
      return Response.json(
        { success: false, error: 'Contact ID, subject, and description are required' },
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

    console.log('Creating ticket for contact:', contactId, 'deal:', dealId, 'subject:', subject)

    // Upload files to HubSpot first if any
    let uploadedFileIds: string[] = []
    if (files && files.length > 0) {
      console.log('Uploading', files.length, 'files to HubSpot')
      
      for (const file of files) {
        try {
          console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type)
          
          // Decode base64 content
          const binaryString = atob(file.content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          console.log('File decoded successfully, size:', bytes.length, 'bytes')
          
          // Create FormData for file upload
          const formData = new FormData()
          const blob = new Blob([bytes], { type: file.type })
          
          formData.append('file', blob, file.name)
          formData.append('folderId', '250402102515')
          formData.append('options', JSON.stringify({
            access: 'PUBLIC_NOT_INDEXABLE',
            ttl: 'P3M', // 3 months
            overwrite: false
          }))

          console.log('Uploading to HubSpot Files API...')
          const uploadResponse = await fetch('https://api.hubapi.com/filemanager/api/v3/files/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData
          })

          console.log('Upload response status:', uploadResponse.status)
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            console.log('Upload result:', JSON.stringify(uploadResult, null, 2))
            
            // Check if the response has the expected structure
            if (uploadResult.objects && uploadResult.objects.length > 0) {
              uploadedFileIds.push(uploadResult.objects[0].id)
              console.log('File uploaded successfully:', file.name, 'ID:', uploadResult.objects[0].id)
            } else if (uploadResult.id) {
              // Alternative response structure
              uploadedFileIds.push(uploadResult.id)
              console.log('File uploaded successfully:', file.name, 'ID:', uploadResult.id)
            } else {
              console.log('Unexpected upload response structure:', uploadResult)
            }
          } else {
            const errorText = await uploadResponse.text()
            console.error('Failed to upload file:', file.name, 'Status:', uploadResponse.status, 'Error:', errorText)
          }
        } catch (fileError) {
          console.error('Error uploading file:', file.name, 'Error:', fileError)
        }
      }
      console.log('Total files uploaded successfully:', uploadedFileIds.length, 'File IDs:', uploadedFileIds)
    }

    // Create the ticket with file attachments
    const ticketProperties: any = {
      hs_pipeline_stage: '1',
      subject: subject
    }

    // Don't set hs_file_upload on ticket - files will be attached via engagements
    const ticketData = {
      properties: ticketProperties,
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

    // Create an email engagement for the ticket description
    console.log('Creating email engagement for ticket:', ticketId)
    
    const emailEngagementPayload = {
      properties: {
        hs_email_direction: "INCOMING_EMAIL",
        hs_timestamp: Date.now(),
        hs_email_status: "SENT",
        hs_email_subject: subject,
        hs_email_html: description,
        ...(uploadedFileIds.length > 0 && {
          hs_attachment_ids: uploadedFileIds.join(';')
        })
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 198 // Contact <-> Email
            }
          ]
        },
        {
          to: { id: ticketId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 224 // Ticket <-> Email
            }
          ]
        }
      ]
    }

    const createEmailResponse = await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailEngagementPayload)
    })

    if (!createEmailResponse.ok) {
      const errorText = await createEmailResponse.text()
      console.error('Failed to create email engagement. Status:', createEmailResponse.status, 'Error:', errorText)
    } else {
      const emailResult = await createEmailResponse.json()
      console.log('Email engagement created successfully with ID:', emailResult.id)
    }

    return Response.json(
      { 
        success: true, 
        ticket: {
          id: ticketId,
          subject: subject
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