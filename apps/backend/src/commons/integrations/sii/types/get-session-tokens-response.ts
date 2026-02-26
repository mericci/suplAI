import { AxiosInstance } from 'axios';

interface GetSessionTokensResponse {
  siiToken: string; // TOKEN
  client: AxiosInstance;
}

export type { GetSessionTokensResponse };
