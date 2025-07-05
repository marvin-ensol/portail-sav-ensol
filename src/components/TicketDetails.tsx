import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DealInfoCard from "./DealInfoCard";
import { sanitizeMessageHtml } from "@/lib/htmlSanitizer";
import type { TicketData, DealData } from "@/types/hubspot";

interface TicketMessage {
  id: string;
  timestamp: string | null;
  text: string;
  direction: string;
  subject: string;
  attachmentIds: string[];
  isClient: boolean;
  isEnsol: boolean;
}

interface PhotoAttachment {
  id: string;
  name: string;
  extension: string;
  type: string;
  size: number;
  url: string;
  createdAt: string | null;
}

interface TicketDetailsProps {
  ticket: TicketData;
  deal?: DealData;
  onBack: () => void;
}

const TicketDetails = ({ ticket, deal, onBack }: TicketDetailsProps) => {
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

  const formatMessageTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatClosedDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return `Résolu le ${date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })}`;
    } catch {
      return null;
    }
  };

  const isTicketClosed = ticket.status === "4" || ticket.hs_pipeline_stage === "4";
  const closedDateText = isTicketClosed ? formatClosedDate(ticket.lastModified) : null;

  const downloadPhoto = (attachment: PhotoAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      '1': { label: 'Nous allons bientôt traiter votre demande', color: 'bg-yellow-100 text-yellow-700' },
      '2': { label: 'Nous vous demandons plus d\'informations', color: 'bg-gray-100 text-gray-700' },
      '573356530': { label: 'En cours de traitement', color: 'bg-blue-100 text-blue-700' },
      '573359340': { label: 'Intervention planifiée', color: 'bg-orange-100 text-orange-700' },
      '573356532': { label: 'Intervention effectuée', color: 'bg-purple-100 text-purple-700' },
      '4': { label: 'Résolu', color: 'bg-green-100 text-green-700' }
    };
    return statusMap[status] || { label: 'Statut inconnu', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground text-center">
        {ticket.subject}
      </h2>
      
      {/* Deal Info Card */}
      {deal && (
        <DealInfoCard deal={deal} />
      )}
      
      {/* Conversation Area - Framed */}
      <Card className="p-4 bg-card border border-border">
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="text-center text-muted-foreground">
              Chargement des messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun message à afficher
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%] space-y-2">
                    <Card className={`${message.isClient ? 'bg-message-client' : 'bg-message-ensol'} text-foreground border-0`}>
                      <CardContent className="p-3">
                        <div 
                          className="text-sm message-content"
                          dangerouslySetInnerHTML={{ 
                            __html: sanitizeMessageHtml(message.text || message.subject) 
                          }}
                        />
                      </CardContent>
                    </Card>
                    
                    <div className={`flex flex-col ${message.isClient ? 'items-end' : 'items-start'}`}>
                      {/* Photo attachments */}
                      {messageAttachments[message.id] && messageAttachments[message.id].length > 0 && (
                        <div className={`flex flex-wrap gap-2 mb-2 ${message.isClient ? 'justify-end' : 'justify-start'}`}>
                          {messageAttachments[message.id].map((attachment) => (
                            <div
                              key={attachment.id}
                              className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedPhoto(attachment)}
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Ticket Status */}
          <div className="flex justify-center mt-4">
            {(() => {
              const statusBadge = getStatusBadge(ticket.hs_pipeline_stage || ticket.status);
              const isResolved = ticket.hs_pipeline_stage === "4" || ticket.status === "4";
              const statusLabel = isResolved && ticket.lastModified 
                ? `Résolu le ${formatClosedDate(ticket.lastModified)?.replace('Résolu le ', '')}`
                : statusBadge.label;
              
              return (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                  {isResolved && <span className="mr-1">✓</span>}
                  {statusLabel}
                </span>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative w-[75vw] h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              className="w-full h-full object-contain rounded-lg"
            />
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadPhoto(selectedPhoto)}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                Télécharger
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedPhoto(null)}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}
      
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