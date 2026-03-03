import { AxiosInstance } from 'axios';

interface GetSessionTokensResponse {
  siiToken: string; // TOKEN
  client: AxiosInstance;
  legalName: string | null;
}

export type { GetSessionTokensResponse };
