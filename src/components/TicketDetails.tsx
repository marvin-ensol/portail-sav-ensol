import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import DealInfoCard from "./DealInfoCard";
import type { TicketData, DealData } from "@/types/hubspot";

interface TicketDetailsProps {
  ticket: TicketData;
  deal?: DealData;
  onBack: () => void;
}

const TicketDetails = ({ ticket, deal, onBack }: TicketDetailsProps) => {
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
          {/* Initial message bubble (customer) */}
          <div className="flex justify-end">
            <div className="max-w-[80%] space-y-2">
              <Card className="bg-message-client text-foreground border-0">
                <CardContent className="p-3">
                  <p className="text-sm">
                    {ticket.subject}
                  </p>
                </CardContent>
              </Card>
              
              <div className="flex flex-col items-end space-y-1">
                {/* Timestamp */}
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(ticket.createdDate)}
                </span>
                
                {/* Closed status - centered */}
                {closedDateText && (
                  <div className="w-full flex justify-center">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <span>✓</span>
                      <span>{closedDateText}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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