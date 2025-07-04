import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import DealInfoCard from "./DealInfoCard";
import FileUploadArea from "./FileUploadArea";
import FileAttachmentList from "./FileAttachmentList";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { DealData } from "@/types/hubspot";

interface TicketCreationFormProps {
  deal: DealData;
  onSubmit: (description: string, files: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const TicketCreationForm = ({ deal, onSubmit, onBack, isSubmitting = false }: TicketCreationFormProps) => {
  const [description, setDescription] = useState("");
  
  const {
    attachedFiles,
    isDragging,
    previewUrls,
    isImageFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
  } = useFileUpload();

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
      <DealInfoCard deal={deal} />

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
        <FileUploadArea
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
        />

        {/* Attached Files */}
        <FileAttachmentList
          files={attachedFiles}
          previewUrls={previewUrls}
          isImageFile={isImageFile}
          onRemoveFile={removeFile}
        />

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