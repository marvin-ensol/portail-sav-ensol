import { Button } from "@/components/ui/button";
import { User, AlertCircle } from "lucide-react";

interface ContactData {
  contactId: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface SearchResult {
  found: boolean;
  contact?: ContactData;
  message?: string;
  error?: string;
}

interface ContactResultProps {
  searchResult: SearchResult;
  onTryAgain: () => void;
}

const ContactResult = ({ searchResult, onTryAgain }: ContactResultProps) => {
  if (searchResult.found && searchResult.contact) {
    return (
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <User className="h-6 w-6" />
          <span className="text-lg font-semibold">Contact trouvé !</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-xl font-bold text-green-800">
            {searchResult.contact.fullName}
          </h3>
          {searchResult.contact.email && (
            <p className="text-green-700 mt-1">
              📧 {searchResult.contact.email}
            </p>
          )}
          {searchResult.contact.phone && (
            <p className="text-green-700 mt-1">
              📱 {searchResult.contact.phone}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center space-x-2 text-red-600">
        <AlertCircle className="h-6 w-6" />
        <span className="text-lg font-semibold">Contact non trouvé</span>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          {searchResult.message || searchResult.error || 'Aucun contact trouvé avec les informations fournies.'}
        </p>
      </div>
      <Button
        onClick={onTryAgain}
        variant="outline"
        className="w-full"
      >
        Essayer à nouveau
      </Button>
    </div>
  );
};

export default ContactResult;