import React, {
  FC,
  ReactNode,
  Children,
  ImgHTMLAttributes,
  isValidElement,
} from "react"
import { Link } from "react-router-dom"
import styled from "@emotion/styled"
import { RiDraggable } from "@remixicon/react"
import { theme } from "../ThemeProvider/ThemeProvider"
import { Wrapper, containerStyles } from "./Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton, ActionButtonProps } from "../Button/Button"

export const LinkContainer = styled(Link)`
  ${containerStyles}
  display: flex;

  :hover {
    text-decoration: none;
    border-color: ${theme.custom.colors.silverGrayLight};
    box-shadow:
      0 2px 4px 0 rgb(37 38 43 / 10%),
      0 2px 4px 0 rgb(37 38 43 / 10%);
    cursor: pointer;
  }
`

export const Container = styled.div`
  ${containerStyles}
`

export const DraggableContainer = styled.div`
  ${containerStyles}
  display: flex;
`

const Content = () => <></>

export const Body = styled.div`
  flex-grow: 1;
  overflow: hidden;
  margin: 24px;
  ${theme.breakpoints.down("md")} {
    margin: 12px;
  }

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

export const DragArea = styled.div`
  margin: 16px -6px 16px 16px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid ${theme.custom.colors.lightGray2};

  ${theme.breakpoints.down("md")} {
    margin: 12px 0 12px 12px;
    padding-right: 4px;
  }

  svg {
    fill: ${theme.custom.colors.silverGrayDark};
    width: 24px;
    height: 24px;
    ${theme.breakpoints.down("md")} {
      width: 20px;
      height: 20px;
    }
  }
`

const Image = styled.img`
  display: block;
  width: 236px;
  height: 122px;
  margin: 24px 24px 24px 0;
  border-radius: 4px;
  object-fit: cover;
  ${theme.breakpoints.down("md")} {
    width: 111px;
    height: 104px;
    margin: 0;
    border-radius: 0;
  }

  background-color: ${theme.custom.colors.lightGray1};
  flex-shrink: 0;
`

export const Info = styled.div`
  ${{ ...theme.typography.subtitle3 }}
  margin-bottom: 16px;
  ${theme.breakpoints.down("md")} {
    ${{ ...theme.typography.subtitle4 }}
    margin-bottom: 8px;
  }

  color: ${theme.custom.colors.silverGrayDark};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const Title = styled.span`
  flex-grow: 1;
  color: ${theme.custom.colors.darkGray2};
  text-overflow: ellipsis;
  ${{ ...theme.typography.subtitle1 }}
  height: ${theme.typography.pxToRem(40)};
  ${theme.breakpoints.down("md")} {
    ${{ ...theme.typography.subtitle2 }}
    height: ${theme.typography.pxToRem(32)};
  }

  margin: 0;
`

export const Footer = styled.span`
  display: block;
  ${{ ...theme.typography.body3 }}
  color: ${theme.custom.colors.darkGray2};
  white-space: nowrap;
`

export const Bottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: ${theme.typography.pxToRem(32)};
  ${theme.breakpoints.down("md")} {
    height: ${theme.typography.pxToRem(18)};
  }
`

/**
 * Slot intended to contain ListCardAction buttons.
 */
export const Actions = styled.div<{ hasImage?: boolean }>`
  display: flex;
  gap: 8px;
  position: absolute;
  bottom: 24px;
  right: ${({ hasImage }) => (hasImage ? "284px" : "24px")};
  ${theme.breakpoints.down("md")} {
    bottom: 8px;
    gap: 4px;
    right: ${({ hasImage }) => (hasImage ? "120px" : "8px")};
  }

  background-color: ${theme.custom.colors.white};
`

const ListCardActionButton = styled(ActionButton)<{ isMobile?: boolean }>(
  ({ theme }) => ({
    [theme.breakpoints.down("md")]: {
      borderStyle: "none",
      width: "24px",
      height: "24px",
      svg: {
        width: "16px",
        height: "16px",
      },
    },
  }),
)

type CardProps = {
  children: ReactNode[] | ReactNode
  className?: string
  href?: string
  draggable?: boolean
}
export type Card = FC<CardProps> & {
  Content: FC<{ children: ReactNode }>
  Image: FC<ImgHTMLAttributes<HTMLImageElement>>
  Info: FC<{ children: ReactNode }>
  Title: FC<{ children: ReactNode }>
  Footer: FC<{ children: ReactNode }>
  Actions: FC<{ children: ReactNode }>
  Action: FC<ActionButtonProps>
}

const ListCard: Card = ({ children, className, href, draggable }) => {
  const _Container = draggable
    ? DraggableContainer
    : href
      ? LinkContainer
      : Container

  let content, imageProps, info, title, footer, actions

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Content) content = child.props.children
    else if (child.type === Image) imageProps = child.props
    else if (child.type === Info) info = child.props.children
    else if (child.type === Title) title = child.props.children
    else if (child.type === Footer) footer = child.props.children
    else if (child.type === Actions) actions = child.props.children
  })

  const classNames = ["MitListCard-root", className ?? ""].join(" ")
  if (content) {
    return (
      <_Container className={classNames} to={href!}>
        {content}
      </_Container>
    )
  }

  return (
    <Wrapper className={classNames}>
      <_Container to={href!}>
        {draggable && (
          <DragArea>
            <RiDraggable />
          </DragArea>
        )}
        <Body>
          <Info>{info}</Info>
          <Title>
            <TruncateText lineClamp={2}>{title}</TruncateText>
          </Title>
          <Bottom>
            <Footer>{footer}</Footer>
          </Bottom>
        </Body>
        {imageProps && (
          // alt text will be checked on ListCard.Image
          // eslint-disable-next-line styled-components-a11y/alt-text
          <Image {...(imageProps as ImgHTMLAttributes<HTMLImageElement>)} />
        )}
      </_Container>
      {actions && <Actions hasImage={!!imageProps}>{actions}</Actions>}
    </Wrapper>
  )
}

ListCard.Content = Content
ListCard.Image = Image
ListCard.Info = Info
ListCard.Title = Title
ListCard.Footer = Footer
ListCard.Actions = Actions
ListCard.Action = ListCardActionButton

export { ListCard }
export { ListCardActionButton }
