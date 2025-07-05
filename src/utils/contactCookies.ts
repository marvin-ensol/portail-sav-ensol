import type { IdentificationMethod } from "@/types/hubspot";

const CONTACT_COOKIE_NAME = 'ensol_contact_session';

export interface ContactSession {
  method: IdentificationMethod;
  value: string;
  timestamp: number;
}

export const saveContactSession = (method: IdentificationMethod, value: string) => {
  const session: ContactSession = {
    method,
    value,
    timestamp: Date.now()
  };
  
  // Store for 30 days
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);
  
  document.cookie = `${CONTACT_COOKIE_NAME}=${JSON.stringify(session)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
};

export const getContactSession = (): ContactSession | null => {
  const cookies = document.cookie.split(';');
  const contactCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CONTACT_COOKIE_NAME}=`)
  );
  
  if (!contactCookie) return null;
  
  try {
    const sessionData = contactCookie.split('=')[1];
    const session: ContactSession = JSON.parse(decodeURIComponent(sessionData));
    
    // Check if session is less than 30 days old
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (session.timestamp < thirtyDaysAgo) {
      clearContactSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing contact session:', error);
    clearContactSession();
    return null;
  }
};

export const clearContactSession = () => {
  document.cookie = `${CONTACT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};