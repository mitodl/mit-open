import React from "react"
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  styled,
} from "ol-components"
import { Profile } from "api/hooks/profile"
import { useUserMe } from "api/hooks/user"
import {
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"

type Props = {
  profile: Profile
}

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
}))

const TitleText = styled(Typography)(({ theme }) => ({
  marginTop: "10px",
  marginBottom: "10px",

  color: theme.custom.colors.darkGray2,
  ...theme.typography.h5,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.h5,
  },
}))

const SubTitleText = styled(Typography)(({ theme }) => ({
  marginBottom: "10px",
  color: theme.custom.colors.darkGray2,
  fontSize: "14px",
  ...theme.typography.body2,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.subtitle3,
  },
}))

const PreferencesPage: React.FC<Props> = () => {
  const { data: user } = useUserMe()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionList = useSearchSubscriptionList({
    enabled: !!user?.is_authenticated,
  })

  const unsubscribe = subscriptionDelete.mutate
  if (!user || subscriptionList.isLoading) return null
  console.log(subscriptionList.data[0])

  return (
    <>
      <TitleText>Following</TitleText>
      <SubTitleText>
        All topics, academic departments, and MIT units you are following.
      </SubTitleText>
      <FollowList>
        {subscriptionList.data.map((subscriptionItem) => (
          <ListItem
            divider={true}
            key={subscriptionItem.id}
            secondaryAction={
              <ListItemButton onClick={() => unsubscribe(subscriptionItem.id)}>
                Unfollow
              </ListItemButton>
            }
          >
            <ListItemText
              primary={subscriptionItem.source_description}
              secondary={SOURCE_LABEL_DISPLAY[subscriptionItem.source_label]}
            />
          </ListItem>
        ))}
      </FollowList>
    </>
  )
}

export { PreferencesPage }
