import { Button } from "@/components/ui/button";
import { X, Image } from "lucide-react";

interface FileAttachmentListProps {
  files: File[];
  previewUrls: { [key: number]: string };
  isImageFile: (file: File) => boolean;
  onRemoveFile: (index: number) => void;
}

const FileAttachmentList = ({ files, previewUrls, isImageFile, onRemoveFile }: FileAttachmentListProps) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Fichiers sélectionnés :</p>
      <div className="grid grid-cols-2 gap-3">
        {files.map((file, index) => (
          <div key={index} className="relative bg-muted p-3 rounded-lg">
            {isImageFile(file) && previewUrls[index] ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={previewUrls[index]}
                    alt={file.name}
                    className="w-full h-20 object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileAttachmentList;