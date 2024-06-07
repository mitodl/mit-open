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

export type Size = "small" | "medium"

const Container = styled(Link)`
  border-radius: 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background: ${theme.custom.colors.white};
  overflow: hidden;
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

const Content = () => <></>

const Body = styled.div`
  flex-grow: 1;
  margin: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Image = styled.img`
  display: block;
  background-size: cover;
  background-repeat: no-repeat;
  -webkit-background-position: center;
  background-position: center;
  width: 236px;
  height: 122px;
  margin: 24px 24px 24px 0;
  border-radius: 4px;
  background-color: ${theme.custom.colors.lightGray1};
`

const Info = styled.div`
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.silverGrayDark};
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`

const Title = styled.h3`
  flex-grow: 1;
  text-overflow: ellipsis;
  ${{ ...theme.typography.subtitle1 }}
  height: ${theme.typography.pxToRem(40)};
  overflow: hidden;
  margin: 0;
  @supports (-webkit-line-clamp: 2) {
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
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
`

const Bottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 32px;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

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
}

const ListCard: Card = ({ children, className, href }) => {
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
      <Container className={className} to={href!}>
        {content}
      </Container>
    )
  }

  return (
    <Container className={className} to={href!}>
      <Body>
        <Info>{info}</Info>
        <Title>{title}</Title>
        <Bottom>
          <Footer>{footer}</Footer>
          {actions && <Actions>{actions}</Actions>}
        </Bottom>
      </Body>
      {imageProps && (
        <Image {...(imageProps as ImgHTMLAttributes<HTMLImageElement>)} />
      )}
    </Container>
  )
}

ListCard.Content = Content
ListCard.Image = Image
ListCard.Info = Info
ListCard.Title = Title
ListCard.Footer = Footer
ListCard.Actions = Actions

export { ListCard }
