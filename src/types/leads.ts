export interface MeetingLead {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  notes?: string;
  source: 'scanned_qr' | 'guest_submission' | 'manual_card' | 'camera_scanner';
  createdAt: string;
}

export const LEADS_STORAGE_KEY = 'ingrade_meeting_leads_v1';

export function getStoredLeads(): MeetingLead[] {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading stored leads:', err);
  }
  return [
    {
      id: 'lead-sample-1',
      name: 'Rajesh Sharma',
      company: 'Apex Retail Brands',
      phone: '+91 98201 12345',
      email: 'rajesh@apexbrands.in',
      notes: 'Interested in WebAR 3D catalog for luxury watches and retail stores.',
      source: 'guest_submission',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'lead-sample-2',
      name: 'Vikram Mehta',
      company: 'Omni Media Group',
      phone: '+91 97110 54321',
      email: 'vikram@omnimediagroup.com',
      notes: 'Met at tech summit; wants Ingrade 3D interactive viewer on product pages.',
      source: 'manual_card',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];
}

export function saveLead(lead: Omit<MeetingLead, 'id' | 'createdAt'>): MeetingLead {
  const currentLeads = getStoredLeads();
  const newLead: MeetingLead = {
    ...lead,
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  const updated = [newLead, ...currentLeads];
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so open tabs/components can re-render immediately
    window.dispatchEvent(new CustomEvent('ingrade_leads_updated', { detail: newLead }));
  } catch (err) {
    console.error('Error saving lead:', err);
  }
  return newLead;
}

export function deleteLead(leadId: string): void {
  const currentLeads = getStoredLeads();
  const updated = currentLeads.filter((l) => l.id !== leadId);
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ingrade_leads_updated'));
  } catch (err) {
    console.error('Error deleting lead:', err);
  }
}
