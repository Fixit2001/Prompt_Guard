const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export interface EmailDetectionResult {
  emails: string[];
  hasEmails: boolean;
}

export const emailDetection = {
  detectEmails(text: string): EmailDetectionResult {
    const matches = text.match(EMAIL_REGEX);
    const emails = matches ? [...new Set(matches)] : [];
    
    return {
      emails,
      hasEmails: emails.length > 0
    };
  },

  isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }
};