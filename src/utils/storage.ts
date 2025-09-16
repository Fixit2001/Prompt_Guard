export interface DetectedEmail {
  email: string;
  timestamp: number;
}

export interface DismissedEmail {
  email: string;
  dismissedAt: number;
}

export interface StorageData {
  issues: DetectedEmail[];
  dismissed: DismissedEmail[];
}

const DISMISS_DURATION = 24 * 60 * 60 * 1000;

export const storageUtils = {
  async getStorageData(): Promise<StorageData> {
    const result = await chrome.storage.local.get(['issues', 'dismissed']);
    return {
      issues: result.issues || [],
      dismissed: result.dismissed || []
    };
  },

  async addDetectedEmail(email: string): Promise<void> {
    const data = await this.getStorageData();
    const timestamp = Date.now();
    
    const existingIndex = data.issues.findIndex(item => item.email === email);
    
    if (existingIndex === -1) {
      data.issues.push({ email, timestamp });
    } else {
      data.issues[existingIndex].timestamp = timestamp;
    }
    
    await chrome.storage.local.set({ issues: data.issues });
  },

  async dismissEmail(email: string): Promise<void> {
    const data = await this.getStorageData();
    const dismissedAt = Date.now();
    
    const filteredDismissed = data.dismissed.filter(item => item.email !== email);

    filteredDismissed.push({ email, dismissedAt });
    
    await chrome.storage.local.set({ dismissed: filteredDismissed });
  },

  async getActiveDismissedEmails(): Promise<string[]> {
    const data = await this.getStorageData();
    const now = Date.now();
    
    const activeDismissed = data.dismissed.filter(
      item => (now - item.dismissedAt) < DISMISS_DURATION
    );
    
    if (activeDismissed.length !== data.dismissed.length) {
      await chrome.storage.local.set({ dismissed: activeDismissed });
    }
    
    return activeDismissed.map(item => item.email);
  },

  async getActiveIssues(): Promise<DetectedEmail[]> {
    const data = await this.getStorageData();
    const activeDismissed = await this.getActiveDismissedEmails();
    
    return data.issues.filter(issue => !activeDismissed.includes(issue.email));
  },

  async getAllIssues(): Promise<DetectedEmail[]> {
    const data = await this.getStorageData();
    return data.issues;
  },

  async getDismissedEmails(): Promise<DismissedEmail[]> {
    const data = await this.getStorageData();
    return data.dismissed;
  }
};