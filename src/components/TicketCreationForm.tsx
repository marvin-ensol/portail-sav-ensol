import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import DealInfoCard from "./DealInfoCard";
import FileUploadArea from "./FileUploadArea";
import FileAttachmentList from "./FileAttachmentList";
import AdminEmailInput from "./AdminEmailInput";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAdminMode } from "@/hooks/useAdminMode";
import type { DealData } from "@/types/hubspot";

interface TicketCreationFormProps {
  deal?: DealData;
  onSubmit: (subject: string, description: string, files: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const TicketCreationForm = ({ deal, onSubmit, onBack, isSubmitting = false }: TicketCreationFormProps) => {
  const isAdminMode = useAdminMode();
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [adminEmail, setAdminEmail] = useState("@goensol.com");
  const [adminNotes, setAdminNotes] = useState("");
  
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
    onSubmit(subject, description, attachedFiles);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center mb-6">
        Comment pouvons-nous vous aider ?
      </h2>

      {/* Deal Information Card - only show if deal is provided */}
      {deal && <DealInfoCard deal={deal} />}

      {/* Ticket Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Field */}
        <div className="space-y-2">
          <Label htmlFor="subject">Objet</Label>
          <Input
            id="subject"
            placeholder="L'objet de votre demande en une phrase"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

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

        {/* Admin Fields */}
        {isAdminMode && (
          <Card className="p-4 bg-muted/30 border-2 border-dashed border-muted-foreground/20">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Champs admin
              </h3>
              
              <AdminEmailInput
                value={adminEmail}
                onChange={setAdminEmail}
              />
              
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Notes Ensol</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Ces notes aident l'équipe SAV et ne sont pas visibles pour le client"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-32"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isSubmitting || !description.trim() || !subject.trim()}
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