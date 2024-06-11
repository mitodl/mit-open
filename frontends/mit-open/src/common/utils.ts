const getSearchParamMap = (urlParams: URLSearchParams) => {
  const params: Record<string, string[] | string> = {}
  for (const [key] of urlParams.entries()) {
    const paramValues = urlParams.getAll(key)
    const finalparams = paramValues.flatMap((p) => p.split(","))
    params[key] = finalparams
  }
  return params
}

export { getSearchParamMap }
