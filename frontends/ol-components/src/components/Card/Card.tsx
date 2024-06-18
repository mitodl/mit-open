import React, {
  FC,
  ReactNode,
  Children,
  ImgHTMLAttributes,
  isValidElement,
  CSSProperties,
} from "react"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"
import { pxToRem } from "../ThemeProvider/typography"
import { Link } from "react-router-dom"

export type Size = "small" | "medium"

/*
 *The relative positioned wrapper allows the action buttons to live adjacent to the
 * Link container in the DOM structure. They cannot be a descendent of it as
 * buttons inside anchors are not valid HTML.
 */
export const Wrapper = styled.div<{ size?: Size }>`
  position: relative;
  ${({ size }) => {
    let width
    if (!size) return ""
    if (size === "medium") width = 300
    if (size === "small") width = 192
    return `
      min-width: ${width}px;
      max-width: ${width}px;
    `
  }}
`

export const containerStyles = `
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  overflow: hidden;
`

const LinkContainer = styled(Link)`
  ${containerStyles}
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

const Container = styled.div`
  ${containerStyles}
  display: block;
  position: relative;
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

const Title = styled.h3<{ lines?: number; size?: Size }>`
  text-overflow: ellipsis;
  height: ${({ lines, size }) => {
    const lineHeightPx = size === "small" ? 18 : 20
    lines = lines ?? (size === "small" ? 2 : 3)
    return theme.typography.pxToRem(lines * lineHeightPx)
  }};
  overflow: hidden;
  margin: 0;

  ${({ size }) =>
    size === "small"
      ? { ...theme.typography.subtitle2 }
      : { ...theme.typography.subtitle1 }}

  ${({ lines, size }) => {
    lines = lines ?? (size === "small" ? 2 : 3)
    return `
      @supports (-webkit-line-clamp: ${lines}) {
        white-space: initial;
        display: -webkit-box;
        -webkit-line-clamp: ${lines};
        -webkit-box-orient: vertical;
      }`
  }}
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

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  size?: Size
  style?: CSSProperties
}
type TitleProps = {
  children?: ReactNode
  lines?: number
  style?: CSSProperties
}
type SlotProps = { children?: ReactNode; style?: CSSProperties }

type Card = FC<CardProps> & {
  Content: FC<{ children: ReactNode }>
  Image: FC<ImageProps>
  Info: FC<SlotProps>
  Title: FC<TitleProps>
  Footer: FC<SlotProps>
  Actions: FC<SlotProps>
}

const Card: Card = ({ children, className, size, href }) => {
  let content,
    image: ImageProps = {},
    info: SlotProps = {},
    title: TitleProps = {},
    footer: SlotProps = {},
    actions: SlotProps = {}

  const _Container = href ? LinkContainer : Container

  /*
   * Allows rendering child elements to specific "slots":
   *   <Card>
   *      <Card.Title>
   *        <Title>The Title</Title>
   *      <Card.Title>
   *      <Card.Image src="url" />
   *   <Card>
   * Akin to alternative interface:
   *   <Card title={<Title>The Title</Title>} image={<Image src="url" />} />.
   *
   * An RFC here provides rationale: https://github.com/nihgwu/rfcs/blob/neo/slots/text/0000-slots.md
   */
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Content) content = child.props.children
    else if (child.type === Image) image = child.props
    else if (child.type === Info) info = child.props
    else if (child.type === Title) title = child.props
    else if (child.type === Footer) footer = child.props
    else if (child.type === Actions) actions = child.props
  })

  if (content) {
    return (
      <Wrapper className={className} size={size}>
        <_Container className={className} to={href!}>
          {content}
        </_Container>
      </Wrapper>
    )
  }

  return (
    <Wrapper className={className} size={size}>
      <_Container to={href!}>
        {image && (
          <Image
            size={size}
            {...(image as ImgHTMLAttributes<HTMLImageElement>)}
          />
        )}
        <Body>
          {info.children && (
            <Info size={size} {...info}>
              {info.children}
            </Info>
          )}
          <Title size={size} {...title}>
            {title.children}
          </Title>
        </Body>
        <Bottom>
          <Footer {...footer}>{footer.children}</Footer>
        </Bottom>
      </_Container>
      {actions.children && <Actions {...actions}>{actions.children}</Actions>}
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
