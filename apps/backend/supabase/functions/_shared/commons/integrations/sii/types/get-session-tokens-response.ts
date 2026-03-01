interface GetSessionTokensResponse {
  siiToken: string; // TOKEN cookie value
  cookieString: string; // Raw Cookie header for subsequent SII requests
}

export type { GetSessionTokensResponse };
