import React from "react"
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Link,
  styled,
} from "ol-components"
import { useUserMe } from "api/hooks/user"
import {
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"

const SOURCE_LABEL_DISPLAY = {
  topic: "Topic",
  unit: "MIT Unit",
  department: "MIT Academic Department",
  "saved search": "Saved Search",
}

const FollowList = styled(List)(() => ({
  borderRadius: "4px",
  background: "#fff",
  padding: "0px",
  margin: "0px",
}))

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.custom.colors.red,
}))

const TitleText = styled(Typography)(({ theme }) => ({
  marginTop: "20px",
  marginBottom: "5px",

  color: theme.custom.colors.darkGray2,
  ...theme.typography.h5,
}))

const SubTitleText = styled(Typography)(({ theme }) => ({
  marginBottom: "10px",
  color: theme.custom.colors.darkGray2,
  fontSize: "14px",
  ...theme.typography.body2,
}))

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
          <ListItem
            divider={true}
            key={subscriptionItem.id}
            secondaryAction={
              <StyledLink
                onClick={(event) => {
                  event.preventDefault()
                  unsubscribe(subscriptionItem.id)
                }}
              >
                Unfollow
              </StyledLink>
            }
          >
            <ListItemText
              primary={subscriptionItem.source_description}
              secondary={
                SOURCE_LABEL_DISPLAY[
                  subscriptionItem.source_label as keyof typeof SOURCE_LABEL_DISPLAY
                ]
              }
            />
          </ListItem>
        ))}
      </FollowList>
    </>
  )
}

export { SettingsPage }
