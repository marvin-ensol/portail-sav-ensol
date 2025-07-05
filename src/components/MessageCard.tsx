import { Card, CardContent } from "@/components/ui/card";
import { sanitizeMessageHtml } from "@/lib/htmlSanitizer";
import MessageAttachments from "./MessageAttachments";
import type { PhotoAttachment, TicketMessage } from "@/types/ticket";

interface MessageCardProps {
  message: TicketMessage;
  attachments?: PhotoAttachment[];
  onPhotoClick: (photo: PhotoAttachment) => void;
}

const MessageCard = ({ message, attachments, onPhotoClick }: MessageCardProps) => {
  const formatMessageTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex ${message.isClient ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <Card className={`${message.isClient ? 'bg-message-client' : 'bg-message-ensol'} text-foreground border-0`}>
          <CardContent className="p-3">
            <div 
              className="text-sm message-content"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeMessageHtml(message.text || message.subject) 
              }}
            />
          </CardContent>
        </Card>
        
        <div className={`flex flex-col ${message.isClient ? 'items-end' : 'items-start'}`}>
          <MessageAttachments 
            attachments={attachments || []}
            isClient={message.isClient}
            onPhotoClick={onPhotoClick}
          />
          
          {/* Timestamp */}
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageCard;