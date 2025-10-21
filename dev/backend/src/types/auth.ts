  // ===== AUTH =====
  export type AuthConfig = {
    username: string;
    passwordHash: string;
    jwtSecret: string;
  };
  
  export type LoginRequest = {
    username: string;
    password: string;
  };
  
  export type LoginResponse = {
    success: boolean;
    token?: string;
    error?: string;
  };
  
  export type JWTPayload = {
    username: string;
    iat: number;
    exp: number;
  };