import axios from "axios"

/**
 * Our axios instance with default baseURL, headers, etc.
 */
const instance = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  withCredentials:
    APP_SETTINGS.axios_with_credentials?.toLowerCase() === "true" || false,
})

export default instance
