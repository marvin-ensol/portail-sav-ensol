import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketFormHeaderProps {
  currentStep: number;
  searchResult?: {
    found: boolean;
    contact?: {
      firstname?: string;
    };
  };
}

const TicketFormHeader = ({ currentStep, searchResult }: TicketFormHeaderProps) => {
  const getTitle = () => {
    if (currentStep === 2 && searchResult?.found && searchResult.contact?.firstname) {
      return `Bonjour, ${searchResult.contact.firstname}`;
    }
    if (currentStep === 5) {
      return "Demande envoyée";
    }
    return "Support Ensol";
  };

  const getDescription = () => {
    switch (currentStep) {
      case 3:
      case 4:
        return "Envoi d'une nouvelle demande";
      case 5:
        return "Notre équipe étudie votre demande et vous contactera dans les plus brefs délais";
      default:
        return "Suivi de vos demandes d'assistance";
    }
  };

  return (
    <CardHeader className="text-center">
      <CardTitle className="text-2xl font-bold gradient-text">
        {getTitle()}
      </CardTitle>
      <CardDescription>
        {getDescription()}
      </CardDescription>
    </CardHeader>
  );
};

export default TicketFormHeader;