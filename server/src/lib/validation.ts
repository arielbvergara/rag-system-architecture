const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPREADSHEET_ID_REGEX = /^[a-zA-Z0-9_-]{20,}$/;
const DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidSpreadsheetId(id: string): boolean {
  return SPREADSHEET_ID_REGEX.test(id);
}

export function isValidDriveFileId(id: string): boolean {
  return DRIVE_FILE_ID_REGEX.test(id);
}
