interface Parameters {
  [key: string]: string | number | null | undefined | boolean | string[] | number[];
}

/**
 * Generic function to build a query string based on a parameters object
 *
 * @param parameters  Parameters witch which to build the query string
 *
 * @returns Query string
 */
const buildQueryString = (parameters: Parameters): string => {
  const queryString = new URLSearchParams();

  Object.entries(parameters).forEach(([key, value]) => {
    if (typeof value === 'string') {
      queryString.set(key, value);
    }
    if (typeof value === 'number') {
      queryString.set(key, String(value));
    }
    if (typeof value === 'boolean') {
      queryString.set(key, value ? '1' : '0');
    }
    if (value === null) {
      queryString.set(key, 'null');
    }
    if (Array.isArray(value)) {
      queryString.set(key, value.join(','));
    }
  });

  return queryString.toString();
};

export default buildQueryString;
