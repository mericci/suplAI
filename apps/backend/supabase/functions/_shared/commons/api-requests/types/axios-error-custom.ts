import type { AxiosError, AxiosRequestConfig } from 'axios';

interface AxiosConfig extends AxiosRequestConfig {
  retryCount?: number;
}

interface AxiosConfigCustom extends AxiosConfig {
  retryCount: number;
}

/** Axios error with config narrowed to include required retryCount */
type AxiosErrorCustom = Omit<AxiosError, 'config'> & {
  config: AxiosConfigCustom;
};

export default AxiosErrorCustom;
