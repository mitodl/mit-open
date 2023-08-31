import { findBestRun } from "./index"
import * as factories from "api/test-utils/factories"
import { faker } from "@faker-js/faker/locale/en"

const makeRun = factories.learningResources.run
const fromNow = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const { shuffle } = faker.helpers

describe("findBestRun", () => {
  const future = makeRun({
    start_date: fromNow(5),
    end_date: fromNow(30),
    title: "future",
  })
  const farFuture = makeRun({
    start_date: fromNow(50),
    end_date: fromNow(80),
    title: "farFuture",
  })
  const past = makeRun({
    start_date: fromNow(-30),
    end_date: fromNow(-5),
    title: "past",
  })
  const farPast = makeRun({
    start_date: fromNow(-70),
    end_date: fromNow(-60),
    title: "farPast",
  })
  const current1 = makeRun({
    start_date: fromNow(-5),
    end_date: fromNow(10),
    title: "current1",
  })
  const current2 = makeRun({
    start_date: fromNow(-10),
    end_date: fromNow(5),
    title: "current2",
  })
  const undated = makeRun({
    start_date: null,
    end_date: null,
    title: "undated",
  })

  it("returns undefined if no runs", () => {
    expect(findBestRun([])).toBeUndefined()
  })

  it("Picks current run if available", () => {
    const runs = [past, current1, current2, future, farFuture, undated]
    const expected = current1
    const actual = findBestRun(shuffle(runs))
    expect(actual).toEqual(expected)
  })

  it("Picks future if no current runs", () => {
    const runs = [farPast, past, future, farFuture, undated]
    const expected = future
    const actual = findBestRun(shuffle(runs))
    expect(actual).toEqual(expected)
  })

  it("Picks recent past if no future or current", () => {
    const runs = [past, farPast, undated]
    const expected = past
    const actual = findBestRun(shuffle(runs))
    expect(actual).toEqual(expected)
  })

  test("undated OK as last resort", () => {
    const runs = [undated]
    const expected = undated
    const actual = findBestRun(shuffle(runs))
    expect(actual).toEqual(expected)
  })
})
