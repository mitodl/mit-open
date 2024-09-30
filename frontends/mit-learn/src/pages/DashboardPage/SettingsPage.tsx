import React from "react"
import {
  PlainList,
  Typography,
  Link,
  styled,
  Button,
  Dialog,
} from "ol-components"
import { useUserMe } from "api/hooks/user"
import {
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"
import * as NiceModal from "@ebay/nice-modal-react"
const SOURCE_LABEL_DISPLAY = {
  topic: "Topic",
  unit: "MIT Unit",
  department: "MIT Academic Department",
  saved_search: "Saved Search",
}

const FollowList = styled(PlainList)(({ theme }) => ({
  borderRadius: "8px",
  background: theme.custom.colors.white,
  border: `1px solid ${theme.custom.colors.lightGray2}`,
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
  ...theme.typography.body2,
}))

const SettingsHeader = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  [theme.breakpoints.down("md")]: {
    paddingBottom: "8px",
  },
}))

const SettingsHeaderLeft = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  flex: "1 0 0",
})

const SettingsHeaderRight = styled.div(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const ListItem = styled.li(({ theme }) => [
  {
    padding: "16px 32px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
    ":last-child": {
      borderBottom: "none",
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

type UnfollowDialogProps = {
  subscriptionIds?: number[]
  subscriptionName?: string
}
const UnfollowDialog = NiceModal.create(
  ({ subscriptionIds, subscriptionName }: UnfollowDialogProps) => {
    const modal = NiceModal.useModal()
    const subscriptionDelete = useSearchSubscriptionDelete()
    const unsubscribe = subscriptionDelete.mutate
    return (
      <Dialog
        {...NiceModal.muiDialogV5(modal)}
        onConfirm={async () => {
          subscriptionIds?.map((subscriptionId) => unsubscribe(subscriptionId))
        }}
        title="Unfollow"
        confirmText={
          subscriptionIds?.length === 1 ? "Yes, Unfollow" : "Yes, Unfollow All"
        }
      >
        {subscriptionIds?.length === 1 ? (
          <>
            Are you sure you want to unfollow <b>{subscriptionName}</b>?
          </>
        ) : (
          <>
            Are you sure you want to <b>Unfollow All</b>? You will stop getting
            emails for all topics, academic departments, and MIT units you are
            following.{" "}
          </>
        )}
      </Dialog>
    )
  },
)

const SettingsPage: React.FC = () => {
  const { data: user } = useUserMe()

  const subscriptionList = useSearchSubscriptionList({
    enabled: !!user?.is_authenticated,
  })

  if (!user || subscriptionList.isLoading) return null

  return (
    <>
      <SettingsHeader>
        <SettingsHeaderLeft>
          <TitleText>Following</TitleText>
          <SubTitleText>
            All topics, academic departments, and MIT units you are following.
          </SubTitleText>
        </SettingsHeaderLeft>
        <SettingsHeaderRight>
          <Button
            variant="tertiary"
            onClick={() =>
              NiceModal.show(UnfollowDialog, {
                subscriptionIds: subscriptionList?.data?.map(
                  (subscriptionItem) => subscriptionItem.id,
                ),
                subscriptionName: "All",
                id: "all",
              })
            }
          >
            Unfollow All
          </Button>
        </SettingsHeaderRight>
      </SettingsHeader>
      <FollowList data-testid="follow-list">
        {subscriptionList?.data?.map((subscriptionItem) => (
          <ListItem key={subscriptionItem.id}>
            <ListItemBody
              title={subscriptionItem.source_description}
              subtitle={
                SOURCE_LABEL_DISPLAY[
                  subscriptionItem.source_label as keyof typeof SOURCE_LABEL_DISPLAY
                ]
              }
            />
            <StyledLink
              onClick={() =>
                NiceModal.show(UnfollowDialog, {
                  subscriptionIds: [subscriptionItem.id],
                  subscriptionName: subscriptionItem.source_description,
                  id: subscriptionItem.id.toString(),
                })
              }
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
