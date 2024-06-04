import React, {
  FC,
  ReactNode,
  Children,
  ImgHTMLAttributes,
  isValidElement,
} from "react"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const cardStyles = `
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  box-shadow:
    0 2px 4px 0 rgb(37 38 43 / 10%),
    0 2px 4px 0 rgb(37 38 43 / 10%);
  overflow: hidden;
`

const Container = styled.div`
  ${cardStyles}
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

// const Container = styled(Card)<{ mobile: boolean }>`
//   display: flex;
//   flex-direction: column;
//   flex-shrink: 0;
//   overflow: hidden;
//   ${({ mobile }) => (mobile ? "width: 274px" : "")}
// `

const Image = styled.img`
  display: block;
  background-size: cover;
  background-repeat: no-repeat;
  -webkit-background-position: center;
  background-position: center;
  width: 100%;
  object-fit: cover;
  height: 172px;
  border-radius:;
`

const Title = styled.p`
  ${{ ...theme.typography.subtitle1 }}
  text-overflow: ellipsis;
  height: ${theme.typography.pxToRem(60)};
  overflow: hidden;
  margin: 16px;

  @supports (-webkit-line-clamp: 3) {
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`

const Footer = styled.span`
  ${{
    ...theme.typography.body3,
    color: theme.custom.colors.silverGrayDark,
  }}

  display: block;
  span {
    color: ${theme.custom.colors.black};
  }
`

const Bottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 0 16px 16px 16px;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

type CardProps = {
  children: ReactNode[]
  className?: string
  link?: boolean
  href?: string
}
type Card = FC<CardProps> & {
  Image: FC<ImgHTMLAttributes<HTMLImageElement>>
  Title: FC<{ children: ReactNode }>
  Footer: FC<{ children: ReactNode }>
  Actions: FC<{ children: ReactNode }>
}

const Card: Card = ({ link, href, children, className }) => {
  const _Container = link ? LinkContainer : Container

  let imageProps, title, footer, actions

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Image) imageProps = child.props
    else if (child.type === Title) title = child.props.children
    else if (child.type === Footer) footer = child.props.children
    else if (child.type === Actions) actions = child.props.children
  })

  return (
    <_Container className={className} href={href}>
      {imageProps && (
        <Image {...(imageProps as ImgHTMLAttributes<HTMLImageElement>)} />
      )}
      {title && <Title>{title}</Title>}
      <Bottom>
        {footer && <Footer>{footer}</Footer>}
        {actions && <Actions>{actions}</Actions>}
      </Bottom>
    </_Container>
  )
}

Card.Title = Title
Card.Image = Image
Card.Footer = Footer
Card.Actions = Actions

export { Card, Container as CardContainer, LinkContainer as CardLinkContainer }