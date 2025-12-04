// AuthResponse.java
export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  nombre: string;
  roles: string[];
}
