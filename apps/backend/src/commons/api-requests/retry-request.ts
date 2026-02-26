import { StatusCodes } from 'http-status-codes';
import type { AxiosInstance } from 'axios';
import { delay } from '../time';
import type { AxiosErrorCustom } from './types';
import { dateConstants } from '../constants';

interface RetryRequestParams {
  error: AxiosErrorCustom;
  axiosInstance: AxiosInstance;
}

const maxRetryCount = 7;
const defaultRetryCount = 0;

/**
 * This is used by an Axios interceptor to retry the request if the status code is 429 or 500 and the
 * max retry count has not been reached.
 * @param error AxiosErrorCustom with an additional field to store the current retry count
 * @param axiosInstance AxiosInstance that is responsible for executing the request
 * @returns New request promise or rejected promise
 */
async function retryRequest({
  error,
  axiosInstance,
}: RetryRequestParams): Promise<unknown> {
  const {
    config: request,
    response: { status },
  } = error;

  if (
    !status
    || (status !== StatusCodes.TOO_MANY_REQUESTS
      && status !== StatusCodes.INTERNAL_SERVER_ERROR)
  ) {
    return Promise.reject(error);
  }

  const retryCount = (request.retryCount || defaultRetryCount) + 1;
  request.retryCount = retryCount;
  if (retryCount > maxRetryCount) {
    return Promise.reject(error);
  }

  const timeInMs = retryCount * dateConstants.oneSecondInMilliseconds;
  await delay({
    timeInMs,
  });
  return axiosInstance(request);
}

export default retryRequest;
