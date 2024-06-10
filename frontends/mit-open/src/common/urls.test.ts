import { login } from "./urls"

const { axios_base_path: API_BASE_URL } = APP_SETTINGS

test("login encodes the next parameter appropriately", () => {
  expect(login()).toBe(`${API_BASE_URL}/login/ol-oidc/?next=http://localhost/`)
  expect(login({})).toBe(
    `${API_BASE_URL}/login/ol-oidc/?next=http://localhost/`,
  )

  expect(
    login({
      pathname: "/foo/bar",
    }),
  ).toBe(`${API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar`)

  expect(
    login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    }),
  ).toBe(
    `${API_BASE_URL}/login/ol-oidc/?next=http://localhost/foo/bar%3Fcat%3Dmeow`,
  )
})
