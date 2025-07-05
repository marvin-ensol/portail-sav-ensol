export interface TicketMessage {
  id: string;
  timestamp: string | null;
  text: string;
  direction: string;
  subject: string;
  attachmentIds: string[];
  isClient: boolean;
  isEnsol: boolean;
}

export interface PhotoAttachment {
  id: string;
  name: string;
  extension: string;
  type: string;
  size: number;
  url: string;
  createdAt: string | null;
}