import * as React from "react"
import styled from "@emotion/styled"
import MuiPopper from "@mui/material/Popper"
import type { PopperProps } from "@mui/material/Popper"
import Fade from "@mui/material/Fade"
import { FocusTrap } from "@mui/base/FocusTrap"
import ClickAwayListener from "@mui/material/ClickAwayListener"

/**
 * Based on MUI demo:
 * https://github.com/mui/material-ui/blob/d3ef60158ba066779102fba775dda6765e2cc0f5/docs/data/material/components/popper/ScrollPlayground.js#L175
 */
const StyledPopper = styled(MuiPopper)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  "& > div": {
    position: "relative",
  },
  '&[data-popper-placement*="bottom"]': {
    "& > div": {
      marginTop: 2,
    },
    "& .MuiPopper-arrow": {
      top: 0,
      marginTop: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "0 1em 1em 1em",
        borderColor: `transparent transparent ${theme.palette.background.paper} transparent`,
      },
    },
  },
  '&[data-popper-placement*="top"]': {
    "& > div": {
      marginBottom: 2,
    },
    "& .MuiPopper-arrow": {
      bottom: 0,
      marginBottom: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "1em 1em 0 1em",
        borderColor: `${theme.palette.background.paper} transparent transparent transparent`,
      },
    },
  },
  '&[data-popper-placement*="right"]': {
    "& > div": {
      marginLeft: 2,
    },
    "& .MuiPopper-arrow": {
      left: 0,
      marginLeft: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 1em 1em 0",
        borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
      },
    },
  },
  '&[data-popper-placement*="left"]': {
    "& > div": {
      marginRight: 2,
    },
    "& .MuiPopper-arrow": {
      right: 0,
      marginRight: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 0 1em 1em",
        borderColor: `transparent transparent transparent ${theme.palette.background.paper}`,
      },
    },
  },
}))

const getModifiers = (
  arrowEl: HTMLElement | null,
): PopperProps["modifiers"] => [
  {
    name: "flip",
    enabled: true,
  },
  {
    name: "preventOverflow",
    enabled: true,
  },
  {
    name: "arrow",
    enabled: !!arrowEl,
    options: {
      element: arrowEl,
    },
  },
  {
    name: "offset",
    options: {
      offset: [0, 10],
    },
  },
  {
    name: "preventOverflow",
    enabled: true,
    options: {
      padding: 8,
    },
  },
]

const Arrow = styled("div")({
  position: "absolute",
  fontSize: 7,
  width: "3em",
  height: "3em",
  "&::before": {
    content: '""',
    margin: "auto",
    display: "block",
    width: 0,
    height: 0,
    borderStyle: "solid",
  },
})

const Content = styled.div(({ theme }) => ({
  padding: "16px",
  backgroundColor: theme.custom.colors.white,
  borderRadius: "8px",
  boxShadow:
    "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 6px 24px 0px rgba(37, 38, 43, 0.24)",
}))

type PopoverProps = Pick<PopperProps, "anchorEl" | "placement" | "open"> & {
  children?: React.ReactNode
  /**
   * Called when
   *  - clicking outside the popover
   *  - pressing "Escape"
   */
  onClose: () => void
  /**
   * If true (default: `true`), traps focus.
   *
   * Note: "Escape" closes the popover.
   */
  modal?: boolean
}
const Popover: React.FC<PopoverProps> = ({
  children,
  onClose,
  modal = true,
  open,
  ...props
}) => {
  const [arrowRef, setArrowRef] = React.useState<HTMLDivElement | null>(null)
  const modifiers = getModifiers(arrowRef)
  const content = (
    <div tabIndex={-1}>
      <ClickAwayListener onClickAway={onClose}>
        <Content>
          <Arrow ref={setArrowRef} className="MuiPopper-arrow" />
          {children}
        </Content>
      </ClickAwayListener>
    </div>
  )
  return (
    <StyledPopper
      open={open}
      modifiers={modifiers}
      transition
      {...props}
      {...(modal ? { role: "dialog" } : {})}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose()
        }
      }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={300}>
          {modal ? (
            <div>
              <FocusTrap open={open}>{content}</FocusTrap>
            </div>
          ) : (
            content
          )}
        </Fade>
      )}
    </StyledPopper>
  )
}

export { Popover }
export type { PopoverProps }
