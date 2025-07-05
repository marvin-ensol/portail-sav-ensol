import type { PhotoAttachment } from "@/types/ticket";

interface MessageAttachmentsProps {
  attachments: PhotoAttachment[];
  isClient: boolean;
  onPhotoClick: (photo: PhotoAttachment) => void;
}

const MessageAttachments = ({ attachments, isClient, onPhotoClick }: MessageAttachmentsProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 mb-2 ${isClient ? 'justify-end' : 'justify-start'}`}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onPhotoClick(attachment)}
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default MessageAttachments;