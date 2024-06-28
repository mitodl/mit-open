import React, {
  FC,
  ReactNode,
  Children,
  ImgHTMLAttributes,
  isValidElement,
} from "react"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"
import { Link } from "react-router-dom"
import { Wrapper, containerStyles } from "./Card"
import { TruncateText } from "../TruncateText/TruncateText"
import { ActionButton, ActionButtonProps } from "../Button/Button"

const LinkContainer = styled(Link)`
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

const Container = styled.div`
  ${containerStyles}
`

const Content = () => <></>

const Body = styled.div`
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

const Info = styled.div`
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

const Title = styled.h3`
  flex-grow: 1;
  color: ${theme.custom.colors.darkGray2};
  text-overflow: ellipsis;
  ${{ ...theme.typography.subtitle1 }}
  height: ${theme.typography.pxToRem(40)};
  ${theme.breakpoints.down("md")} {
    ${{ ...theme.typography.subtitle3 }}
    height: ${theme.typography.pxToRem(32)};
  }

  margin: 0;
`

const Footer = styled.span`
  display: block;
  ${{
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
  }}

  span {
    color: ${theme.custom.colors.black};
  }

  white-space: nowrap;
`

const Bottom = styled.div`
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
const Actions = styled.div<{ hasImage?: boolean }>`
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
}
type Card = FC<CardProps> & {
  Content: FC<{ children: ReactNode }>
  Image: FC<ImgHTMLAttributes<HTMLImageElement>>
  Info: FC<{ children: ReactNode }>
  Title: FC<{ children: ReactNode }>
  Footer: FC<{ children: ReactNode }>
  Actions: FC<{ children: ReactNode }>
  Action: FC<ActionButtonProps>
}

const ListCard: Card = ({ children, className, href }) => {
  const _Container = href ? LinkContainer : Container

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

  if (content) {
    return (
      <_Container className={className} to={href!}>
        {content}
      </_Container>
    )
  }

  return (
    <Wrapper className={className}>
      <_Container to={href!}>
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
