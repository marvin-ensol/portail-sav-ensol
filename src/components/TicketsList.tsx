import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TicketData } from "@/types/hubspot";

interface TicketsListProps {
  tickets: TicketData[];
  isLoading: boolean;
  onTicketClick: (ticket: TicketData) => void;
}

const TicketsList = ({
  tickets,
  isLoading,
  onTicketClick
}: TicketsListProps) => {
  // Determine default tab based on ticket counts
  const defaultTab = useMemo(() => {
    const ongoingCount = tickets.filter(ticket => ticket.status !== "4").length;
    return ongoingCount > 0 ? "ongoing" : "resolved";
  }, [tickets]);
  
  const [activeTab, setActiveTab] = useState<"ongoing" | "resolved">(defaultTab);

  // Update active tab when tickets change (e.g., after initial load)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const filteredAndSortedTickets = useMemo(() => {
    // Filter tickets based on status
    const filtered = tickets.filter(ticket => 
      activeTab === "ongoing" ? ticket.status !== "4" : ticket.status === "4"
    );

    // Sort by creation date (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate || 0).getTime();
      const dateB = new Date(b.createdDate || 0).getTime();
      return dateB - dateA;
    });
  }, [tickets, activeTab]);

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

  const formatCreatedDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return `Créée le ${date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })}`;
    } catch {
      return 'Date invalide';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Toutes vos demandes</h3>
      
      {/* Status Toggle */}
      <div className="flex justify-center">
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => setActiveTab(value as "ongoing" | "resolved")} 
          className="w-full max-w-sm"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ongoing">En cours</TabsTrigger>
            <TabsTrigger value="resolved">Résolues</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">
            Recherche de vos demandes...
          </p>
        </div>
      ) : filteredAndSortedTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredAndSortedTickets.map(ticket => {
            const statusBadge = getStatusBadge(ticket.hs_pipeline_stage || ticket.status);

            return (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-primary" 
                onClick={() => onTicketClick(ticket)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Status badge at top */}
                    <div className="flex justify-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    
                    {/* Title with ticket icon */}
                    <div className="flex items-center space-x-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {ticket.subject}
                      </h4>
                    </div>
                    
                    {/* Created date at bottom */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatCreatedDate(ticket.createdDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Ticket className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p>{activeTab === "ongoing" ? "Aucunes demandes en cours" : "Aucunes demandes résolues"}</p>
        </div>
      )}
    </div>
  );
};

export default TicketsList;