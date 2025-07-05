import { Card, CardContent } from "@/components/ui/card";
import { Building2, Clock } from "lucide-react";
import type { DealData } from "@/types/hubspot";

interface DealInfoCardProps {
  deal: DealData;
}

const DealInfoCard = ({ deal }: DealInfoCardProps) => {
  const formatInstallationDate = (dateString: string | null) => {
    if (!dateString) return 'Non encore installé';
    try {
      const date = new Date(dateString);
      return `Installé le ${date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })}`;
    } catch {
      return 'Date invalide';
    }
  };

  const transformProductName = (product: string) => {
    return product === 'PV' ? 'Panneaux' : product;
  };

  const getProductBadgeColor = (product: string, index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700', 
      'bg-pink-100 text-pink-700',
      'bg-orange-100 text-orange-700',
      'bg-green-100 text-green-700',
      'bg-indigo-100 text-indigo-700'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="border-l-4 border-l-primary bg-muted/30">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Products badges */}
          <div className="flex flex-wrap gap-1">
            {deal.products.length > 0 ? (
              deal.products.map((product, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProductBadgeColor(product, index)}`}
                >
                  {transformProductName(product)}
                </span>
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
            <span>{formatInstallationDate(deal.dateEnteredInstallationDone)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealInfoCard;