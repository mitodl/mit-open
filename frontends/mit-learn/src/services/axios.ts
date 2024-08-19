import axios from "axios"

/**
 * Our axios instance with default baseURL, heads, etc.
 */
const instance = axios.create({
  baseURL: "/api/v0",
  xsrfCookieName: process.env.CSRF_COOKIE_NAME,
  xsrfHeaderName: "X-CSRFToken",
})

export default instance
