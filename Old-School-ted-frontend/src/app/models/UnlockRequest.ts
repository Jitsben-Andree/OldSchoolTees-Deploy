export interface UnlockRequest {
  email: string;
  code: string;
  newPassword?: string; 
}