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

const Content = () => <></>

// const Container = styled(Card)<{ mobile: boolean }>`
//   display: flex;
//   flex-direction: column;
//   flex-shrink: 0;
//   overflow: hidden;
//   ${({ mobile }) => (mobile ? "width: 274px" : "")}
// `

const Info = styled.div`
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.silverGrayDark};
  display: flex;
  justify-content: space-between;
  margin: 16px 16px 8px;
`

const Image = styled.img`
  display: block;
  background-size: cover;
  background-repeat: no-repeat;
  -webkit-background-position: center;
  background-position: center;
  width: 100%;
  height: 172px;
  background-color: ${theme.custom.colors.lightGray1};
`

const Title = styled.div`
  ${{ ...theme.typography.subtitle1 }}
  text-overflow: ellipsis;
  height: ${theme.typography.pxToRem(60)};
  overflow: hidden;
  margin: 8px 16px 16px 16px;

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
  // isLoading: boolean
  children: ReactNode[] | ReactNode
  className?: string
  link?: boolean
  href?: string
}
type Card = FC<CardProps> & {
  Content: FC<{ children: ReactNode }>
  Image: FC<ImgHTMLAttributes<HTMLImageElement>>
  Info: FC<{ children: ReactNode }>
  Title: FC<{ children: ReactNode }>
  Footer: FC<{ children: ReactNode }>
  Actions: FC<{ children: ReactNode }>
}

const Card: Card = ({ link, href, children, className }) => {
  const _Container = link ? LinkContainer : Container

  // if (isLoading) {
  //   return <Container className={className}>

  //   </Container>
  // }

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
    return <Container className={className}>{content}</Container>
  }

  return (
    <_Container className={className} href={href}>
      {imageProps && (
        <Image {...(imageProps as ImgHTMLAttributes<HTMLImageElement>)} />
      )}
      {info && <Info>{info}</Info>}
      {title && <Title>{title}</Title>}
      <Bottom>
        {footer && <Footer>{footer}</Footer>}
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
