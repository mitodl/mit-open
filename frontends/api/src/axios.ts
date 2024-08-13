import axios from "axios"

/**
 * Our axios instance with default baseURL, headers, etc.
 */
const instance = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  withXSRFToken: true,
  withCredentials: APP_SETTINGS.MITOL_AXIOS_WITH_CREDENTIALS,
})

export default instance
