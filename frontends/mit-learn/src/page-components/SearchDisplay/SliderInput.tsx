import * as React from "react"
import { Slider } from "ol-components"

const SliderInput: React.FC<{
  currentValue: number
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void
  urlParam: string
  min: number
  max: number
  step: number
}> = ({ currentValue, setSearchParams, urlParam, min, max, step }) => {
  const [sliderDisplayValue, setSliderDisplayValue] =
    React.useState<number>(currentValue)

  const handleChange = (
    event: Event | React.SyntheticEvent,
    newValue: number | number[],
  ) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set(urlParam, newValue.toString())
      return next
    })
  }

  return (
    <div>
      <Slider
        data-testid={`${urlParam}-slider`}
        value={sliderDisplayValue || 0}
        onChange={(event: Event, newValue: number | number[]) => {
          setSliderDisplayValue(newValue as number)
        }}
        onChangeCommitted={handleChange}
        valueLabelDisplay="auto"
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}

export default SliderInput
