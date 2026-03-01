import type { AxiosResponse } from 'axios';
import axios from 'axios';
import axiosErrorHandler from './axios-error-handler.ts';

interface DeleteParams {
  url: string;
  options: Record<string, unknown>;
}
interface Response<TResponse> {
  headers: Record<string, unknown>;
  data: TResponse;
}

/**
 * Generic DELETE method function using axios.
 *
 * @param url      The complete URL to be requested.
 * @param options  Object with headers and method information.
 *
 * @returns The api response.
 */
async function deleteRequest<TResponse>({
  url,
  options,
}: DeleteParams): Promise<Response<TResponse>> {
  try {
    const response = await axios.delete<TResponse, AxiosResponse<TResponse>>(
      url,
      options,
    );
    const { headers, data } = response;
    return {
      headers,
      data,
    };
  } catch (error) {
    const { status, data } = error.response;
    throw axiosErrorHandler({
      status,
      message: data,
    });
  }
}

export default deleteRequest;
