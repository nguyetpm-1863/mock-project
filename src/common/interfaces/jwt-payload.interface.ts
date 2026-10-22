export interface JwtPayload {
  sub: string;
  ver: number;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}
