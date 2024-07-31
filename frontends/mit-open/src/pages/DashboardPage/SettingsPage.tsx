import React from "react"
import { PlainList, Typography, Link, styled } from "ol-components"
import { useUserMe } from "api/hooks/user"
import {
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"

const SOURCE_LABEL_DISPLAY = {
  topic: "Topic",
  unit: "MIT Unit",
  department: "MIT Academic Department",
  saved_search: "Saved Search",
}

const FollowList = styled(PlainList)(() => ({
  borderRadius: "4px",
  background: "#fff",
  padding: "0px",
}))

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.custom.colors.red,
}))

const TitleText = styled(Typography)(({ theme }) => ({
  marginTop: "16px",
  marginBottom: "8px",

  color: theme.custom.colors.darkGray2,
  ...theme.typography.h5,
}))

const SubTitleText = styled(Typography)(({ theme }) => ({
  marginBottom: "16px",
  color: theme.custom.colors.darkGray2,
  fontSize: theme.typography.p3,
  ...theme.typography.body2,
}))

const ListItem = styled.li(({ theme }) => [
  {
    padding: "16px 32px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    border: `1px solid ${theme.custom.colors.lightGray2}`,
    ":not(:last-child)": {
      borderBottom: "none",
    },
    ":first-child, :last-child": {
      borderRadius: "4px",
    },
  },
])
const _ListItemBody = styled.div({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "4px",
  flex: "1 0 0",
})
const Title = styled.span(({ theme }) => ({
  ...theme.typography.subtitle1,
  color: theme.custom.colors.darkGray2,
}))
const Subtitle = styled.span(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.custom.colors.silverGrayDark,
}))
type ListItemBodyProps = {
  children?: React.ReactNode
  title?: string
  subtitle?: string
}
const ListItemBody: React.FC<ListItemBodyProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <_ListItemBody>
      {children}
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
    </_ListItemBody>
  )
}

const SettingsPage: React.FC = () => {
  const { data: user } = useUserMe()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionList = useSearchSubscriptionList({
    enabled: !!user?.is_authenticated,
  })

  const unsubscribe = subscriptionDelete.mutate
  if (!user || subscriptionList.isLoading) return null

  return (
    <>
      <TitleText>Following</TitleText>
      <SubTitleText>
        All topics, academic departments, and MIT units you are following.
      </SubTitleText>
      <FollowList>
        {subscriptionList?.data?.map((subscriptionItem) => (
          <ListItem divider={true} key={subscriptionItem.id}>
            <ListItemBody
              title={subscriptionItem.source_description}
              subtitle={
                SOURCE_LABEL_DISPLAY[
                  subscriptionItem.source_label as keyof typeof SOURCE_LABEL_DISPLAY
                ]
              }
            />
            <StyledLink
              onClick={(event) => {
                event.preventDefault()
                unsubscribe(subscriptionItem.id)
              }}
            >
              Unfollow
            </StyledLink>
          </ListItem>
        ))}
      </FollowList>
    </>
  )
}

export { SettingsPage }
