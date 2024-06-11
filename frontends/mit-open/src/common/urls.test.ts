import { login } from "./urls"

const { MITOPEN_AXIOS_BASE_PATH } = process.env

test("login encodes the next parameter appropriately", () => {
  expect(login()).toBe(
    `${MITOPEN_AXIOS_BASE_PATH}/login/ol-oidc/?next=http://localhost/`,
  )
  expect(login({})).toBe(
    `${MITOPEN_AXIOS_BASE_PATH}/login/ol-oidc/?next=http://localhost/`,
  )

  expect(
    login({
      pathname: "/foo/bar",
    }),
  ).toBe(
    `${MITOPEN_AXIOS_BASE_PATH}/login/ol-oidc/?next=http://localhost/foo/bar`,
  )

  expect(
    login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    }),
  ).toBe(
    `${MITOPEN_AXIOS_BASE_PATH}/login/ol-oidc/?next=http://localhost/foo/bar%3Fcat%3Dmeow`,
  )
})
