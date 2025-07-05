import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import type { PhotoAttachment } from "@/types/ticket";

interface PhotoModalProps {
  photo: PhotoAttachment | null;
  onClose: () => void;
  onDownload: (photo: PhotoAttachment) => void;
}

const PhotoModal = ({ photo, onClose, onDownload }: PhotoModalProps) => {
  if (!photo) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-[75vw] h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-contain rounded-lg"
        />
        
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDownload(photo)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            Télécharger
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhotoModal;