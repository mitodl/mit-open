/* eslint-disable testing-library/no-node-access */
import React from "react"
import fs from "node:fs"
import yaml from "yaml"
import RootTopicIcon from "./RootTopicIcon"
import { render } from "@testing-library/react"

const loadFile = (path: string) => {
  const file = fs.readFileSync(path, "utf8")
  return yaml.parse(file)
}

/**
 * Based on update_topics in `learning_resources/utils.py`.
 *
 * Returns the topic hierarchy.
 */
const loadTopics = () => {
  const path = `${process.env.PROJECT_CWD}/learning_resources/data/ocw-topics.yaml`
  const { collections } = loadFile(path)
  let topicHierarchy: Record<string, unknown> = {}
  for (const collection of collections) {
    if (collection.category === "Settings") {
      for (const file of collection.files) {
        for (const field of file.fields) {
          if (field.label === "Topics") {
            topicHierarchy = field.options_map
          }
        }
      }
    }
  }
  return topicHierarchy
}

describe("TopicIcon", () => {
  const rootTopicNames = Object.keys(loadTopics())

  /**
   * Since we've hard-coded root-level topic associations on the frontend, lets
   * at least make sure we have an icon for each of them.
   */
  test.each(rootTopicNames)("Root topics all have an icon", (name) => {
    expect(rootTopicNames.length).toBe(11)
    render(<RootTopicIcon name={name} />)
    const svg = document.querySelector("svg")
    expect(svg).toBeVisible()
  })

  test("Unknown topics have a visibly hidden icon", () => {
    render(<RootTopicIcon name="Unknown Topic" />)
    const svg = document.querySelector("svg")
    expect(svg).not.toBeVisible()
  })
})
