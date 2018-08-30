// @flow
import { assert } from "chai"
import { shallow } from "enzyme"

import { S } from "./sanctuary"
import React from "react"
const { Maybe } = S

export const assertMaybeEquality = (m1: Maybe, m2: Maybe) => {
  assert(S.equals(m1, m2), `expected ${m1.value} to equal ${m2.value}`)
}

export const assertIsNothing = (m: Maybe) => {
  assert(m.isNothing, `should be nothing, is ${m}`)
}

export const assertIsJust = (m: Maybe, val: any) => {
  assert(m.isJust, `should be Just(${val}), is ${m}`)
  assert.deepEqual(m.value, val)
}

export const assertIsJustNoVal = (m: Maybe) => {
  assert(m.isJust, "should be a Just")
}

export const shouldIf = (tf: boolean) => (tf ? "should" : "should not")

export const shouldIfGt0 = (num: number) => shouldIf(num > 0)

export class TestPage extends React.Component<*, *> {
  props: {}

  render() {
    return <div />
  }
}

export const configureShallowRenderer = (
  Component: Class<React.Component<*, *>> | Function,
  defaultProps: Object
) => (extraProps: Object = {}) =>
  shallow(<Component {...defaultProps} {...extraProps} />)
