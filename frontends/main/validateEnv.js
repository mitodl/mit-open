/**
 * Validate the environment variables we use throughout the app.
 *
 * This only validates them. It does not transform them (e.g., into a boolean).
 * Env vars should still be accessed via process.env.ENV_VAR
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yup = require("yup")

const schema = yup.object().shape({
  // Server-only env vars
  MITOL_NOINDEX: yup.string().oneOf(["true", "false"]),
  // Client or Server env vars
  NEXT_PUBLIC_APPZI_URL: yup.string(),
  NEXT_PUBLIC_ORIGIN: yup.string().required(),
  NEXT_PUBLIC_MITOL_API_BASE_URL: yup.string().required(),
  NEXT_PUBLIC_PUBLIC_URL: yup.string().required(),
  NEXT_PUBLIC_SITE_NAME: yup.string().required(),
  NEXT_PUBLIC_MITOL_SUPPORT_EMAIL: yup.string().required(),
  NEXT_PUBLIC_EMBEDLY_KEY: yup.string(),
  NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS: yup
    .string()
    .oneOf(["true", "false"]),
  NEXT_PUBLIC_CSRF_COOKIE_NAME: yup.string().required(),
})

const validateEnv = () => schema.validateSync(process.env)

module.exports = { validateEnv }
