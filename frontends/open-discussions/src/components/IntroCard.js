// @flow
import React from "react"
import { Link } from "react-router-dom"

import Card from "./Card"

import { userIsAnonymous } from "../lib/util"
import { REGISTER_URL, newPostURL, MIT_LOGO_URL } from "../lib/url"

export default function IntroCard() {
  return (
    <Card className="home-callout">
      <div className="logo-col">
        <img src={MIT_LOGO_URL} alt="MIT Logo" />
      </div>
      <div className="callout-body">
        <div className="text-col">
          <h3>Learn. Share. Connect.</h3>
          <p>
            A place where learners, teachers and scientists worldwide meet with
            MIT.
          </p>
        </div>
        <div className="action-col">
          <Link
            className="link-button"
            to={userIsAnonymous() ? REGISTER_URL : newPostURL()}
          >
            {userIsAnonymous() ? "Become a member" : "Create a post"}
          </Link>
        </div>
      </div>
    </Card>
  )
}
