"use client"
import { Button, ButtonLink } from "ol-components"
import Link from "next/link"

export default function Home() {
  return (
    <main>
      Hello, world!
      <Button>Click me</Button>
      <ul>
        <li>
          <ButtonLink href="/topics">Topics</ButtonLink>
        </li>
        <li>
          <ButtonLink href="/departments">Departments</ButtonLink>
        </li>
      </ul>
    </main>
  )
}
