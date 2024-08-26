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
  const handleChange = (event: Event, newValue: number | number[]) => {
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
        value={currentValue || 0}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}

export default SliderInput
