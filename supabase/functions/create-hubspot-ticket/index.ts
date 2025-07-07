import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HUBSPOT_BASE_URL = "https://api.hubapi.com/crm/v3"

interface FileUpload {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface ContactDetails {
  email: string;
  firstName: string;
  lastName: string;
}

interface AdminData {
  email: string;
  notes: string;
}

async function uploadFilesToHubSpot(files: FileUpload[], accessToken: string): Promise<string[]> {
  const uploadedFileIds: string[] = []
  
  if (!files || files.length === 0) {
    return uploadedFileIds
  }

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
  return uploadedFileIds
}

async function createHubSpotTicket(contactId: string, dealId: string | undefined, subject: string, accessToken: string) {
  const ticketProperties: any = {
    hs_pipeline_stage: '1',
    subject: subject,
    is_created_from_support_portal: 'true'
  }

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
    throw new Error(`Failed to create ticket: ${createTicketResponse.status} - ${errorText}`)
  }

  const ticketResult = await createTicketResponse.json()
  const ticketId = ticketResult.id

  console.log('Ticket created successfully with ID:', ticketId)
  return ticketId
}

async function fetchContactDetails(contactId: string, accessToken: string): Promise<ContactDetails> {
  console.log('Fetching contact details for ID:', contactId)
  const contactResponse = await fetch(`${HUBSPOT_BASE_URL}/objects/contacts/${contactId}?properties=email,firstname,lastname`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  let contactEmail = 'unknown@example.com' // fallback
  let contactFirstName = 'Unknown'
  let contactLastName = 'Contact'
  
  if (contactResponse.ok) {
    const contactData = await contactResponse.json()
    contactEmail = contactData.properties?.email || contactEmail
    contactFirstName = contactData.properties?.firstname || contactFirstName
    contactLastName = contactData.properties?.lastname || contactLastName
    console.log('Contact details retrieved:', { email: contactEmail, firstName: contactFirstName, lastName: contactLastName })
  } else {
    console.error('Failed to fetch contact details:', contactResponse.status)
  }

  return {
    email: contactEmail,
    firstName: contactFirstName,
    lastName: contactLastName
  }
}

async function createEmailEngagement(
  contactId: string, 
  ticketId: string, 
  subject: string, 
  description: string, 
  contactDetails: ContactDetails,
  uploadedFileIds: string[],
  accessToken: string
) {
  console.log('Creating email engagement for ticket:', ticketId)
  
  // Convert line breaks to HTML for proper display
  const htmlDescription = description.replace(/\n/g, '<br>')
  
  const emailEngagementPayload = {
    properties: {
      hs_email_direction: "INCOMING_EMAIL",
      hs_timestamp: Date.now(),
      hs_email_status: "SENT",
      hs_email_subject: subject,
      hs_email_html: htmlDescription,
      hs_email_headers: JSON.stringify({
        from: {
          email: contactDetails.email,
          firstName: contactDetails.firstName,
          lastName: contactDetails.lastName
        },
        to: [
          {
            email: "client@goensol.com",
            firstName: "SAV",
            lastName: "Ensol"
          }
        ],
        cc: [],
        bcc: []
      }),
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
}

async function createAdminNote(
  ticketId: string,
  adminData: AdminData,
  accessToken: string
) {
  console.log('Creating admin note for ticket:', ticketId)
  
  // Format the note HTML content
  const noteHtml = `<div style="" dir="auto" data-top-level="true"><p style="margin:0;"><strong><span style="background-color: #FFF2CC;">Notes partagées par l'Ensolien [${adminData.email}]</span></strong></p><p style="margin:0;">${adminData.notes.replace(/\n/g, '</p><p style="margin:0;">')}</p><br></div>`
  
  const notePayload = {
    properties: {
      hs_timestamp: Date.now(),
      hs_note_body: noteHtml
    },
    associations: [
      {
        to: { id: ticketId },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 228 // Note to Ticket
          }
        ]
      }
    ]
  }

  const createNoteResponse = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notePayload)
  })

  if (!createNoteResponse.ok) {
    const errorText = await createNoteResponse.text()
    console.error('Failed to create admin note. Status:', createNoteResponse.status, 'Error:', errorText)
  } else {
    const noteResult = await createNoteResponse.json()
    console.log('Admin note created successfully with ID:', noteResult.id)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contactId, dealId, subject, description, files, adminData } = await req.json()

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
    const uploadedFileIds = await uploadFilesToHubSpot(files, accessToken)

    // Create the ticket
    const ticketId = await createHubSpotTicket(contactId, dealId, subject, accessToken)

    // Fetch contact details
    const contactDetails = await fetchContactDetails(contactId, accessToken)

    // Create email engagement
    await createEmailEngagement(
      contactId, 
      ticketId, 
      subject, 
      description, 
      contactDetails,
      uploadedFileIds,
      accessToken
    )

    // Create admin note if admin data is provided
    if (adminData) {
      await createAdminNote(ticketId, adminData, accessToken)
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