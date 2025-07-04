import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface FileUploadAreaProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList | null) => void;
}

const FileUploadArea = ({ 
  isDragging, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onFileSelect 
}: FileUploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>Pièces jointes</Label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
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
          onChange={(e) => onFileSelect(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
};

export default FileUploadArea;