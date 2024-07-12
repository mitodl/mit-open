import React from "react"
import styled from "@emotion/styled"
import { RiArrowRightSLine } from "@remixicon/react"
import { Link } from "../Link/Link"
import { theme } from "../ThemeProvider/ThemeProvider"

const BreadcrumbsContainer = styled.span({
  display: "inline-flex",
  paddingBottom: "16px",
  alignItems: "flex-start",
  overflow: "hidden",
  width: "100%",
})

const Breadcrumb = styled.span({
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
})

const BreadcrumbLink = styled(Link)({
  overflow: "hidden",
  textOverflow: "ellipsis",
})

const BreadcrumbText = styled.span({
  textWrap: "nowrap",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
})

const Separator = styled(RiArrowRightSLine)({
  width: "16px",
  height: "16px",
})

const LightSeparator = styled(Separator)({
  color: theme.custom.colors.silverGrayLight,
})

const DarkSeparator = styled(Separator)({
  color: theme.custom.colors.silverGray,
})

const Current = styled(BreadcrumbText)({
  ...theme.typography.body3,
})

const LightCurrent = styled(Current)({
  color: theme.custom.colors.silverGrayDark,
})

const DarkCurrent = styled(Current)({
  color: theme.custom.colors.silverGrayLight,
})

type BreadcrumbsProps = {
  variant: "light" | "dark"
  ancestors: Array<{ href: string; label: string }>
  current: string | undefined
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  const { variant, ancestors, current } = props
  const linkColor = variant === "light" ? "black" : "white"
  const _Separator = variant === "light" ? LightSeparator : DarkSeparator
  const _Current = variant === "light" ? LightCurrent : DarkCurrent
  return (
    <BreadcrumbsContainer>
      {ancestors.map((ancestor, index) => {
        const isLast = index === ancestors.length
        return (
          <Breadcrumb key={ancestor.label}>
            <BreadcrumbLink
              size="small"
              href={ancestor.href}
              color={linkColor}
              hovercolor={linkColor}
            >
              <BreadcrumbText>{ancestor.label}</BreadcrumbText>
            </BreadcrumbLink>
            {!isLast && <_Separator data-testid="breadcrumb-separator" />}
          </Breadcrumb>
        )
      })}
      <Breadcrumb>
        <_Current>{current}</_Current>
      </Breadcrumb>
    </BreadcrumbsContainer>
  )
}

export { Breadcrumbs }
export type { BreadcrumbsProps }
