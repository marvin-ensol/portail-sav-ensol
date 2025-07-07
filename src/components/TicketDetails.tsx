import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DealInfoCard from "./DealInfoCard";
import MessageCard from "./MessageCard";
import PhotoModal from "./PhotoModal";
import TicketStatusBadge from "./TicketStatusBadge";
import { useAdminMode } from "@/hooks/useAdminMode";
import type { TicketData, DealData } from "@/types/hubspot";
import type { TicketMessage, PhotoAttachment } from "@/types/ticket";

interface TicketDetailsProps {
  ticket: TicketData;
  deal?: DealData;
  onBack: () => void;
}

const TicketDetails = ({ ticket, deal, onBack }: TicketDetailsProps) => {
  const isAdminMode = useAdminMode();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAttachment | null>(null);
  const [messageAttachments, setMessageAttachments] = useState<Record<string, PhotoAttachment[]>>({});

  useEffect(() => {
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        console.log('Fetching messages for ticket:', ticket.ticketId);
        
        const { data, error } = await supabase.functions.invoke('get-ticket-messages', {
          body: { ticketId: ticket.ticketId }
        });

        console.log('Messages response:', { data, error });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        if (data.success && data.messages) {
          setMessages(data.messages);
          console.log(`Loaded ${data.messages.length} messages`);
          
          // Fetch attachments for messages that have them
          const messagesWithAttachments = data.messages.filter((msg: TicketMessage) => 
            msg.attachmentIds && msg.attachmentIds.length > 0
          );
          
          if (messagesWithAttachments.length > 0) {
            await fetchAttachmentsForMessages(messagesWithAttachments);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [ticket.ticketId]);

  const fetchAttachmentsForMessages = async (messagesWithAttachments: TicketMessage[]) => {
    try {
      const attachmentsMap: Record<string, PhotoAttachment[]> = {};
      
      for (const message of messagesWithAttachments) {
        if (message.attachmentIds.length > 0) {
          const { data, error } = await supabase.functions.invoke('get-hubspot-attachments', {
            body: { attachmentIds: message.attachmentIds }
          });

          if (error) {
            console.error('Error fetching attachments for message:', message.id, error);
            continue;
          }

          if (data.success && data.attachments) {
            attachmentsMap[message.id] = data.attachments;
            console.log(`Loaded ${data.attachments.length} photo attachments for message ${message.id}`);
          }
        }
      }
      
      setMessageAttachments(attachmentsMap);
    } catch (error) {
      console.error('Error fetching message attachments:', error);
    }
  };

  const downloadPhoto = (attachment: PhotoAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <div className="relative">
        <h2 className="text-xl font-semibold text-foreground text-center">
          {ticket.subject}
        </h2>
        {isAdminMode && (
          <button
            onClick={() => window.open(`https://app-eu1.hubspot.com/contacts/142467012/record/0-5/${ticket.ticketId}`, '_blank')}
            className="absolute top-0 right-0 p-1 hover:bg-gray-100 rounded text-orange-600 hover:text-orange-700 transition-colors"
            title="Ouvrir dans HubSpot"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Deal Info Card */}
      {deal && (
        <DealInfoCard deal={deal} />
      )}
      
      {/* Conversation Area - Framed */}
      <Card className="p-4 bg-card border border-border">
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">
                Chargement des messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun message à afficher
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  attachments={messageAttachments[message.id]}
                  onPhotoClick={setSelectedPhoto}
                />
              ))}
            </>
          )}
          
          <TicketStatusBadge 
            status={ticket.status}
            pipelineStage={ticket.hs_pipeline_stage}
            lastModified={ticket.lastModified}
          />
        </div>
      </Card>

      <PhotoModal 
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDownload={downloadPhoto}
      />
      
      {/* Back Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={onBack}
          className="w-full h-12 text-base font-medium"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>
      </div>
    </div>
  );
};

export default TicketDetails;