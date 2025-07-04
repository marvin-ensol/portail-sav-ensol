import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Clock, Loader2 } from "lucide-react";
import type { TicketData } from "@/types/hubspot";

interface TicketsListProps {
  tickets: TicketData[];
  isLoading: boolean;
  onTicketClick: (ticket: TicketData) => void;
}

const TicketsList = ({ tickets, isLoading, onTicketClick }: TicketsListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Donner suite à une demande existante
      </h3>
      
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">
            Recherche de vos demandes...
          </p>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary"
              onClick={() => onTicketClick(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        #{ticket.ticketId}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {ticket.subject}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Statut: {ticket.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Ticket className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p>Aucuns tickets existants</p>
        </div>
      )}
    </div>
  );
};

export default TicketsList;