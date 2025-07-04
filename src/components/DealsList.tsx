import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, Loader2 } from "lucide-react";
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
          {deals.map((deal) => {
            const formatInstallationDate = (dateString: string | null) => {
              if (!dateString) return 'Date non définie';
              try {
                const date = new Date(dateString);
                return date.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                });
              } catch {
                return 'Date invalide';
              }
            };

            return (
              <Card 
                key={deal.id} 
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary"
                onClick={() => onDealClick(deal)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Products badges */}
                    <div className="flex flex-wrap gap-1">
                      {deal.products.length > 0 ? (
                        deal.products.map((product, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {product}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun produit spécifié</span>
                      )}
                    </div>
                    
                    {/* Address title with building icon */}
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {deal.address && deal.postcode 
                          ? `${deal.address}, ${deal.postcode}`
                          : deal.name
                        }
                      </h4>
                    </div>
                    
                    {/* Installation date */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Installation le {formatInstallationDate(deal.dateEnteredInstallationDone)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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