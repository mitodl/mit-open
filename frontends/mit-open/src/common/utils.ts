const getSearchParamMap = (urlParams: URLSearchParams) => {
  const params: Record<string, string[] | string> = {}
  for (const [key] of urlParams.entries()) {
    const paramValues = urlParams.getAll(key)
    const finalparams = paramValues.map((p) => {
      return p.indexOf(",") !== -1 ? p.split(",") : p
    })
    params[key] = finalparams.flat()
  }
  return params
}

export { getSearchParamMap }
