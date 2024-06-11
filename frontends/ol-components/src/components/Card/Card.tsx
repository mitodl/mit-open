import React, {
  FC,
  ReactNode,
  Children,
  ImgHTMLAttributes,
  isValidElement,
} from "react"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"
import { pxToRem } from "../ThemeProvider/typography"
import { Link } from "react-router-dom"

export type Size = "small" | "medium"

const getWidthCss = ({ size }: { size?: Size }) => {
  let width
  if (size === "medium") width = 300
  if (size === "small") width = 192
  return `
    min-width: ${width}px;
    max-width: ${width}px;
  `
}

// Relative positioned wrapper to position action buttons outside of the child Link (buttons inside anchors is not valid HTML)
const Wrapper = styled.div`
  position: relative;
  ${getWidthCss}
`

const Container = styled(Link)`
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  overflow: hidden;

  display: block;
  position: relative;

  :hover {
    text-decoration: none;
    border-color: ${theme.custom.colors.silverGrayLight};
    box-shadow:
      0 2px 4px 0 rgb(37 38 43 / 10%),
      0 2px 4px 0 rgb(37 38 43 / 10%);
    cursor: pointer;
  }
`

const Content = () => <></>

const Body = styled.div`
  margin: 16px;
`

const Image = styled.img<{ size?: Size }>`
  display: block;
  width: 100%;
  height: ${({ size }) => (size === "small" ? 120 : 170)}px;
  background-color: ${theme.custom.colors.lightGray1};
  object-fit: cover;
`

const Info = styled.div<{ size?: Size }>`
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.silverGrayDark};
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ size }) => (size === "small" ? 4 : 8)}px;
`

const Title = styled.h3<{ size?: Size }>`
  text-overflow: ellipsis;
  height: ${({ size }) => theme.typography.pxToRem(size === "small" ? 36 : 60)};
  overflow: hidden;
  margin: 0;

  ${({ size }) =>
    size === "small"
      ? { ...theme.typography.subtitle2 }
      : { ...theme.typography.subtitle1 }}
  @supports (-webkit-line-clamp: ${({ size }) => (size === "small" ? 2 : 3)}) {
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: ${({ size }) => (size === "small" ? 2 : 3)};
    -webkit-box-orient: vertical;
  }
`

const Footer = styled.span`
  display: block;
  height: ${pxToRem(16)};
  ${{
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
  }}

  span {
    color: ${theme.custom.colors.black};
  }
`

const Bottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 0 16px 16px;
  height: 32px;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  position: absolute;
  bottom: 16px;
  right: 16px;
`

type CardProps = {
  children: ReactNode[] | ReactNode
  className?: string
  size?: Size
  href?: string
}
type Card = FC<CardProps> & {
  Content: FC<{ children: ReactNode }>
  Image: FC<ImgHTMLAttributes<HTMLImageElement> | { size?: Size }>
  Info: FC<{ children: ReactNode }>
  Title: FC<{ children: ReactNode; size?: Size }>
  Footer: FC<{ children: ReactNode }>
  Actions: FC<{ children: ReactNode }>
}

const Card: Card = ({ children, className, size, href }) => {
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
      <Wrapper className={className} size={size}>
        <Container className={className} to={href!}>
          {content}
        </Container>
      </Wrapper>
    )
  }

  return (
    <Wrapper className={className} size={size}>
      <Container to={href!}>
        {imageProps && (
          <Image
            size={size}
            {...(imageProps as ImgHTMLAttributes<HTMLImageElement>)}
          />
        )}
        <Body>
          {info && <Info size={size}>{info}</Info>}
          <Title size={size}>{title}</Title>
        </Body>
        <Bottom>
          <Footer>{footer}</Footer>
        </Bottom>
      </Container>
      {actions && <Actions>{actions}</Actions>}
    </Wrapper>
  )
}

Card.Content = Content
Card.Image = Image
Card.Info = Info
Card.Title = Title
Card.Footer = Footer
Card.Actions = Actions

export { Card }
