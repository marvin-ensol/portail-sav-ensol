export type IdentificationMethod = "phone" | "email";

export interface FormData {
  method: IdentificationMethod | null;
  value: string;
}

export interface TicketData {
  id: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  createdDate: string | null;
  lastModified: string | null;
  hs_pipeline_stage: string;
}

export interface DealData {
  id: string;
  dealId: string;
  name: string;
  stage: string;
  amount: string;
  closeDate: string | null;
  createdDate: string | null;
  pipeline: string;
  dealType: string | null;
  address: string;
  postcode: string;
  dateEnteredInstallationDone: string | null;
  products: string[];
  isQuoteSigned: string;
  isClosedLost?: string;
}

export interface ContactData {
  contactId: string;
  fullName: string;
  firstname?: string;
  email?: string;
  phone?: string;
}

export interface SearchResult {
  found: boolean;
  contact?: ContactData;
  message?: string;
  error?: string;
}