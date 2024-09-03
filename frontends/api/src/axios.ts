import axios from "axios"

/**
 * Our axios instance with default baseURL, headers, etc.
 */
const instance = axios.create({
  xsrfCookieName: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME,
  xsrfHeaderName: "X-CSRFToken",
  withXSRFToken: true,
  withCredentials:
    process.env.NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS === "true",
})

export default instance
