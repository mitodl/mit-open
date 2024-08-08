const getSearchParamMap = (urlParams: URLSearchParams) => {
  const params: Record<string, string[] | string> = {}
  for (const [key] of urlParams.entries()) {
    params[key] = urlParams.getAll(key)
  }
  return params
}

export { getSearchParamMap }
