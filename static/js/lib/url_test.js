// @flow
import { assert } from "chai"

import { channelURL, frontPageURL, newPostURL, postDetailURL, getChannelNameFromPathname } from "./url"

describe("url helper functions", () => {
  describe("channelURL", () => {
    it("should return a good URL", () => {
      assert.equal(channelURL("foobar"), "/channel/foobar")
    })
  })

  describe("postDetailURL", () => {
    it("should return a good URL", () => {
      assert.equal(postDetailURL("foobar", "23434j3j3"), "/channel/foobar/23434j3j3")
    })
  })

  describe("newPostURL", () => {
    it("should return a url for creating a new post", () => {
      assert.equal(newPostURL("channel_name"), "/create_post/channel_name")
    })
  })

  describe("frontPageURL", () => {
    it("should return a url for the front page", () => {
      assert.equal(frontPageURL(), "/")
    })
  })

  describe("getChannelNameFromPathname", () => {
    it("should return a channel", () => {
      ["/channel/foobar/", "/channel/foobar", "/channel/foobar/baz/"].forEach(channel => {
        assert.equal("foobar", getChannelNameFromPathname(channel))
      })
    })

    it("should return null otherwise", () => {
      assert.equal(null, getChannelNameFromPathname(""))
    })
  })
})
