import React from "react"
import { UserList } from "api"
import { pluralize } from "ol-utilities"
import styled from "@emotion/styled"
import { ListCardCondensed } from "../Card/ListCardCondensed"
import Typography from "@mui/material/Typography/Typography"
import { RiListCheck3 } from "@remixicon/react"

const StyledCard = styled(ListCardCondensed)({
  display: "flex",
  alignItems: "center",
  padding: "16px",
  margin: "0",
  gap: "16px",
  width: "100%",
})

const TextContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "8px",
  flex: "1 0 0",
})

const TitleText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
}))

const ItemsText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
}))

const IconContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  borderRadius: "4px",
  color: theme.custom.colors.silverGrayDark,
  background: theme.custom.colors.lightGray1,
}))

type OnActivateCard = (userList: UserList) => void
export type UserListCardCondensedProps<U extends UserList = UserList> = {
  userList: U
  className?: string
  onActivate?: OnActivateCard
  footerActionSlot?: React.ReactNode
}

const UserListCardCondensed = <U extends UserList>({
  userList,
  className,
}: UserListCardCondensedProps<U>) => {
  return (
    <StyledCard className={className}>
      <ListCardCondensed.Content>
        <TextContainer>
          <TitleText variant="subtitle1">{userList.title}</TitleText>
          <ItemsText variant="body3">
            {userList.item_count} {pluralize("item", userList.item_count)}
          </ItemsText>
        </TextContainer>
        <IconContainer>
          <RiListCheck3 size="48" />
        </IconContainer>
      </ListCardCondensed.Content>
    </StyledCard>
  )
}

export { UserListCardCondensed }
