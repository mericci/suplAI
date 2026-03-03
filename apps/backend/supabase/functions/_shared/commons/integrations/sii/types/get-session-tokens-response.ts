interface GetSessionTokensResponse {
  siiToken: string; // TOKEN cookie value
  cookieString: string; // Raw Cookie header for subsequent SII requests
  legalName: string | null;
}

export type { GetSessionTokensResponse };
