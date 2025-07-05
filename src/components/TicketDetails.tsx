import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DealInfoCard from "./DealInfoCard";
import type { TicketData, DealData } from "@/types/hubspot";

interface TicketMessage {
  id: string;
  timestamp: string | null;
  text: string;
  direction: string;
  subject: string;
  isClient: boolean;
  isEnsol: boolean;
}

interface TicketDetailsProps {
  ticket: TicketData;
  deal?: DealData;
  onBack: () => void;
}

const TicketDetails = ({ ticket, deal, onBack }: TicketDetailsProps) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

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
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [ticket.ticketId]);

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
              Aucun message trouvé
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%] space-y-2">
                    <Card className={`${message.isClient ? 'bg-message-client' : 'bg-message-ensol'} text-foreground border-0`}>
                      <CardContent className="p-3">
                        <p className="text-sm">
                          {message.text || message.subject}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <div className={`flex flex-col ${message.isClient ? 'items-end' : 'items-start'} space-y-2`}>
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
          
          {/* Closed status - centered with more spacing */}
          {closedDateText && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <span>✓</span>
                <span>{closedDateText}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
      
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