import * as React from "react"
import { Slider, styled, css } from "ol-components"

const ExplanationContainer = styled.div`
  font-size: 0.875em;
`
const StalenessTitleContainer = styled.div`
  ${({ theme }) => css({ ...theme.typography.subtitle2 })}
  font-size: 0.875em;
  font-style: normal;
  margin-top: 10px;
`

const StalenessPenaltySlider: React.FC<{
  stalenessSliderSetting: number
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void
}> = ({ stalenessSliderSetting, setSearchParams }) => {
  const handleChange = (event: Event, newValue: number | number[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("yearly_decay_percent", newValue.toString())
      return next
    })
  }

  return (
    <div>
      <StalenessTitleContainer>
        Resource Score Staleness Penalty
      </StalenessTitleContainer>
      <div>
        <Slider
          data-testid="staleness-slider"
          value={stalenessSliderSetting || 0}
          onChange={handleChange}
          valueLabelDisplay="auto"
          min={0}
          max={10}
          step={0.2}
        />
        <ExplanationContainer>
          Relavance score penalty percent per year for resources without
          upcoming runs. Only affects results if there is a search term.
        </ExplanationContainer>
      </div>
    </div>
  )
}

export default StalenessPenaltySlider
