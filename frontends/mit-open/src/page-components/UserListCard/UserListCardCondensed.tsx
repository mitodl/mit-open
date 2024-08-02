import React from "react"
import { UserList } from "api"
import { pluralize } from "ol-utilities"
import { RiListCheck3 } from "@remixicon/react"
import { ListCardCondensed, styled, theme, Typography } from "ol-components"

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

type UserListCardCondensedProps<U extends UserList = UserList> = {
  userList: U
  href?: string
  className?: string
}

const UserListCardCondensed = <U extends UserList>({
  userList,
  href,
  className,
}: UserListCardCondensedProps<U>) => {
  return (
    <StyledCard href={href} className={className}>
      <ListCardCondensed.Content>
        <TextContainer>
          <Typography
            variant="subtitle1"
            color={theme.custom.colors.darkGray2}
            component="h1"
          >
            {userList.title}
          </Typography>
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
export type { UserListCardCondensedProps }
