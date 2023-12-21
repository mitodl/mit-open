import { login } from "./urls"

test("login encodes the next parameter appropriately", () => {
  expect(login()).toBe("/login/ol-oidc/?next=/")
  expect(login({})).toBe("/login/ol-oidc/?next=/")

  expect(
    login({
      pathname: "/foo/bar",
    }),
  ).toBe("/login/ol-oidc/?next=/foo/bar")

  expect(
    login({
      pathname: "/foo/bar",
      search: "?cat=meow",
    }),
  ).toBe("/login/ol-oidc/?next=/foo/bar%3Fcat%3Dmeow")
})
