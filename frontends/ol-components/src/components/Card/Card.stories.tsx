import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Card } from "./Card"
import { ActionButton } from "../Button/Button"
import { RiMenuAddLine, RiBookmarkLine } from "@remixicon/react"
import styled from "@emotion/styled"

const StyledCard = styled(Card)`
  width: 300px;
`

const meta: Meta<typeof Card> = {
  title: "ol-components/Card",
  render: () => (
    <StyledCard>
      <Card.Image src="https://openlearninglibrary.mit.edu/asset-v1:MITx+11.154x+3T2018+type@asset+block@course_image.jpg" />
      <Card.Info>Info</Card.Info>
      <Card.Title>Title</Card.Title>
      <Card.Actions>
        <ActionButton
          variant="secondary"
          edge="circular"
          color="secondary"
          size="small"
          onClick={() => {}}
        >
          <RiMenuAddLine />
        </ActionButton>
        <ActionButton
          variant="secondary"
          edge="circular"
          color="secondary"
          size="small"
          onClick={() => {}}
        >
          <RiBookmarkLine />
        </ActionButton>
      </Card.Actions>
      <Card.Footer>Footer</Card.Footer>
    </StyledCard>
  ),
}

export default meta

type Story = StoryObj<typeof Card>

export const Simple: Story = {
  args: {},
}
