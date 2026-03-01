import type { AxiosResponse } from 'axios';
import axios from 'axios';
import axiosErrorHandler from './axios-error-handler.ts';

interface Response<TResponse> {
  headers: Record<string, unknown>;
  data: TResponse;
}

interface PutParams<TBody> {
  url: string;
  body: Record<string, unknown> | TBody;
  options: Record<string, unknown>;
}

/**
 * Generic PUT function using axios
 *
 * @param url The complete url to be requested
 * @param body Object with data to make the post
 * @param options Object with headers and method information
 *
 * @returns The api response
 */
async function put<TResponse, TBody = void>({
  url,
  body,
  options,
}: PutParams<TBody>): Promise<Response<TResponse>> {
  try {
    const response = await axios.put<TResponse, AxiosResponse<TResponse>>(
      url,
      body,
      options,
    );
    const { headers, data } = response;
    return { headers, data };
  } catch (error) {
    const { status, data } = error.response;
    throw axiosErrorHandler({
      status,
      message: data,
    });
  }
}

export default put;
