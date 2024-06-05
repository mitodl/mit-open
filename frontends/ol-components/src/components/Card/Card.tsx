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

export type Size = "small" | "medium"

const cardStyles = `
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  box-shadow:
    0 2px 4px 0 rgb(37 38 43 / 10%),
    0 2px 4px 0 rgb(37 38 43 / 10%);
  overflow: hidden;
`

const Container = styled.div<{ size: Size }>`
  ${cardStyles}
  ${({ size }) => {
    let width
    if (size === "medium") width = 302
    if (size === "small") width = 194
    return `
      min-width: ${width}px;
      max-width: ${width}px;
    `
  }}
`

const LinkContainer = styled.a`
  ${cardStyles}
  :hover {
    text-decoration: none;
    color: ${theme.custom.colors.mitRed};
    border-color: ${theme.custom.colors.silverGrayLight};

    > p {
      color: ${theme.custom.colors.mitRed};
      text-decoration: underline;
    }
  }
`

const Content = () => <></>

const Body = styled.div`
  margin: 16px;
`

const Image = styled.img<{ size?: Size }>`
  display: block;
  background-size: cover;
  background-repeat: no-repeat;
  -webkit-background-position: center;
  background-position: center;
  width: 100%;
  height: ${({ size }) => (size === "small" ? 120 : 170)}px;
  background-color: ${theme.custom.colors.lightGray1};
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
`

type CardProps = {
  children: ReactNode[] | ReactNode
  className?: string
  size?: Size
  link?: boolean
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

const Card: Card = ({ children, className, size = "medium", link, href }) => {
  const _Container = link ? LinkContainer : Container

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
      <Container className={className} size={size}>
        {content}
      </Container>
    )
  }

  return (
    <_Container className={className} href={href} size={size}>
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
        {actions && <Actions>{actions}</Actions>}
      </Bottom>
    </_Container>
  )
}

Card.Content = Content
Card.Image = Image
Card.Info = Info
Card.Title = Title
Card.Footer = Footer
Card.Actions = Actions

export { Card, Container as CardContainer, LinkContainer as CardLinkContainer }
