import axios from "axios"

/**
 * Our axios instance with default baseURL, headers, etc.
 */
const instance = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
})
const withCredentials =
  process.env.MITOPEN_AXIOS_WITH_CREDENTIALS?.toLowerCase() === "true"
instance.defaults.withCredentials = withCredentials || false

export default instance
