import { login } from "./urls"

const { MITOL_API_BASE_URL } = process.env

test("login encodes the next parameter appropriately", () => {
  expect(login()).toBe(
    `${MITOL_API_BASE_URL}/login/ol-oidc/?next=http://localhost/`,
  )
  expect(login({})).toBe(
    `${MITOL_API_BASE_URL}/login/ol-oidc/?next=http://localhost/`,
  )

  expect(
    login({
      pathname: "/foo/bar",
    }),
  ).toBe(`${MITOL_API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar`)

  expect(
    login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    }),
  ).toBe(
    `${MITOL_API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar%3Fcat%3Dmeow`,
  )
})
