import React from "react"
import {
  Typography,
  styled,
  PlainList,
  List,
  ListItem,
  ListItemLink,
  ListItemText,
} from "ol-components"
import { pluralize } from "ol-utilities"
import { RiArrowRightSLine } from "@remixicon/react"

const ChannelGroupTitle = styled.h2<{ inset?: boolean }>(({ theme, inset }) => {
  return [
    {
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      ...theme.typography.h5,
      [theme.breakpoints.down("sm")]: {
        ...theme.typography.subtitle1,
      },
    },
    inset ? { paddingLeft: "10px" } : {},
  ]
})

const ChannelGroupIcon = styled.span(({ theme }) => ({
  paddingRight: "10px",
  verticalAlign: "text-top",
  display: "inline-flex",
  fontSize: theme.typography.pxToRem(20),
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.pxToRem(16),
  },
  "& svg": {
    width: "1em",
    height: "1em",
  },
}))

const ChannelLink = styled(ListItemLink)<{ inset?: boolean }>(
  ({ theme, inset }) => ({
    color: theme.custom.colors.darkGray2,
    borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
    paddingTop: "16px",
    paddingBottom: "16px",
    paddingLeft: inset
      ? `calc(${theme.typography.pxToRem(20)} + 10px)`
      : "10px",
    [theme.breakpoints.down("sm")]: {
      paddingBottom: "12px",
      paddingTop: "12px",
      paddingLeft: inset
        ? `calc(${theme.typography.pxToRem(16)} + 10px)`
        : "10px",
    },
    display: "flex",
    columnGap: "16px",
    "& svg": {
      color: theme.custom.colors.silverGray,
    },
    "& .MuiListItemText-primary": {
      ...theme.typography.subtitle1,
      [theme.breakpoints.down("sm")]: {
        ...theme.typography.subtitle2,
      },
    },
    "& .MuiListItemText-secondary": {
      ...theme.typography.body2,
      color: theme.custom.colors.silverGrayDark,
      marginTop: "4px",
      "& > *": {
        marginRight: "12px",
      },
    },
    "&:hover": {
      backgroundColor: theme.custom.colors.lightGray1,
      ".hover-dark, .MuiListItemText-secondary": {
        color: theme.custom.colors.darkGray1,
      },
      ".hover-highlight": {
        color: theme.custom.colors.lightRed,
        textDecoration: "underline",
      },
    },
    "& .view-link": {
      [theme.breakpoints.down("sm")]: {
        display: "none",
      },
    },
  }),
)

type ChannelSummary = {
  id: number | string
  name: string
  channel_url: string
  courses: number
  programs: number
}

type ChannelGroupProps = {
  title: string
  channels: ChannelSummary[]
  icon?: React.ReactNode
  className?: string
  as?: React.ElementType
}

/**
 * Display a group of channels with links to the channel pages.
 */
const ChannelGroup: React.FC<ChannelGroupProps> = ({
  title,
  channels,
  icon,
  className,
  as: Component = "div",
}) => {
  return (
    <Component className={className}>
      <ChannelGroupTitle inset={!icon}>
        {icon ? <ChannelGroupIcon aria-hidden>{icon}</ChannelGroupIcon> : null}
        {title}
      </ChannelGroupTitle>
      <List disablePadding>
        {channels.map((c) => {
          const counts = [
            { count: c.courses, label: pluralize("Course", c.courses) },
            { count: c.programs, label: pluralize("Program", c.programs) },
          ]
          return (
            <ListItem disablePadding key={c.id}>
              <ChannelLink href={c.channel_url ?? ""}>
                <ListItemText
                  primary={c.name}
                  secondary={counts
                    .filter(({ count }) => count > 0)
                    .map(({ count, label }) => (
                      <span key={label}>{`${count} ${label}`}</span>
                    ))}
                />
                <Typography
                  variant="body2"
                  className="view-link hover-highlight"
                  aria-hidden // This is a visual affordance only. Screenreaders will announce the link ancestor role.
                >
                  View
                </Typography>
                <RiArrowRightSLine className="hover-dark" />
              </ChannelLink>
            </ListItem>
          )
        })}
      </List>
    </Component>
  )
}

const ChannelGroupList = styled(PlainList)(({ theme }) => ({
  "> li": {
    marginTop: "40px",
    marginBottom: "40px",
    [theme.breakpoints.down("sm")]: {
      marginTop: "30px",
      marginBottom: "30px",
    },
  },
}))

export { ChannelGroup, ChannelGroupList }
export type { ChannelSummary, ChannelGroupProps }
