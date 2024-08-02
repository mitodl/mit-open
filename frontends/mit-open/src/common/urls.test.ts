import { login } from "./urls"

const { MITOPEN_API_BASE_URL } = APP_SETTINGS

test("login encodes the next parameter appropriately", () => {
  expect(login()).toBe(
    `${MITOPEN_API_BASE_URL}/login/ol-oidc/?next=http://localhost/`,
  )
  expect(login({})).toBe(
    `${MITOPEN_API_BASE_URL}/login/ol-oidc/?next=http://localhost/`,
  )

  expect(
    login({
      pathname: "/foo/bar",
    }),
  ).toBe(`${MITOPEN_API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar`)

  expect(
    login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    }),
  ).toBe(
    `${MITOPEN_API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar%3Fcat%3Dmeow`,
  )
})
