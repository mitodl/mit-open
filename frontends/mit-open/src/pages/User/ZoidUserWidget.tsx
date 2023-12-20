/* eslint-disable import/no-extraneous-dependencies */
import React from "react"
import ReactDOM from "react-dom"
import * as zoid from "zoid/dist/zoid.frameworks"

const ZoidComponent = zoid.create({
  tag: "user-widget",
  url: "http://localhost:8063/widgets/user-widget/",
})

const ReactComponent = ZoidComponent.driver("react", {
  React: React,
  ReactDOM: ReactDOM,
})

const ZoidUserWidget: React.FC = () => {
  return (
    <div>
      <ReactComponent loadComponent={"load Component"} />
    </div>
  )
}

export default ZoidUserWidget
