import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Clock, ArrowLeft, Upload, X } from "lucide-react";
import type { DealData } from "@/types/hubspot";

interface TicketCreationFormProps {
  deal: DealData;
  onSubmit: (description: string, files: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const TicketCreationForm = ({ deal, onSubmit, onBack, isSubmitting = false }: TicketCreationFormProps) => {
  const [description, setDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatInstallationDate = (dateString: string | null) => {
    if (!dateString) return 'Non encore installé';
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(description, attachedFiles);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">
        Comment pouvons-nous vous aider ?
      </h2>

      {/* Deal Information Card */}
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
              <span>Installation le {formatInstallationDate(deal.dateEnteredInstallationDone)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description du problème</Label>
          <Textarea
            id="description"
            placeholder="Décrivez votre problème en détail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-32"
            required
          />
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label>Pièces jointes</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Glissez-déposez vos fichiers ici ou
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Parcourir les fichiers
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Fichiers sélectionnés :</p>
              <div className="space-y-1">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer"}
          </Button>
          
          <Button
            type="button"
            onClick={onBack}
            className="w-full h-12 text-base font-medium"
            variant="outline"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketCreationForm;