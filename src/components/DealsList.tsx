import { Card, CardContent } from "@/components/ui/card";
import { Building2, Clock, Loader2, Euro } from "lucide-react";
import type { DealData } from "@/types/hubspot";

interface DealsListProps {
  deals: DealData[];
  isLoading: boolean;
  onDealClick: (deal: DealData) => void;
}

const DealsList = ({ deals, isLoading, onDealClick }: DealsListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Quelle est l'installation concernée ?
      </h3>
      
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">
            Recherche de vos installations...
          </p>
        </div>
      ) : deals.length > 0 ? (
        <div className="space-y-3">
          {deals.map((deal) => (
            <Card 
              key={deal.id} 
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary"
              onClick={() => onDealClick(deal)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Installation #{deal.dealId}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {deal.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Statut: {deal.stage}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm font-medium text-primary mb-1">
                      <Euro className="h-3 w-3" />
                      <span>{deal.amount}</span>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deal.stage.toLowerCase().includes('closed') || deal.stage.toLowerCase().includes('won')
                        ? 'bg-green-100 text-green-800' 
                        : deal.stage.toLowerCase().includes('proposal') || deal.stage.toLowerCase().includes('negotiation')
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {deal.stage}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Building2 className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p>Aucunes installations trouvées</p>
        </div>
      )}
    </div>
  );
};

export default DealsList;