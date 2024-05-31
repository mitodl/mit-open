import React, { useCallback } from "react"
import { CardTemplate, TypeRow } from "ol-components"
import { UserList } from "api"
import { EmbedlyConfig, pluralize } from "ol-utilities"

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard = (userList: UserList) => void
type UserListCardTemplateProps<U extends UserList = UserList> = {
  /**
   * Whether the course picture and info display as a column or row.
   */
  variant: CardVariant
  userList: U
  sortable?: boolean
  className?: string
  imgConfig: EmbedlyConfig
  onActivate?: OnActivateCard
  footerActionSlot?: React.ReactNode
}

const UserListCardTemplate = <U extends UserList>({
  variant,
  userList,
  className,
  imgConfig,
  sortable,
  onActivate,
  footerActionSlot,
}: UserListCardTemplateProps<U>) => {
  const handleActivate = useCallback(
    () => onActivate?.(userList),
    [userList, onActivate],
  )
  const extraDetails = (
    <TypeRow>
      <span>{userList.description}</span>
    </TypeRow>
  )
  return (
    <CardTemplate
      variant={variant}
      className={className}
      imgUrl={userList.image?.url}
      imgConfig={imgConfig}
      title={userList.title}
      extraDetails={extraDetails}
      sortable={sortable}
      handleActivate={handleActivate}
      footerSlot={
        <span>
          {userList.item_count} {pluralize("item", userList.item_count)}
        </span>
      }
      footerActionSlot={footerActionSlot}
    ></CardTemplate>
  )
}

export default UserListCardTemplate
export type { UserListCardTemplateProps }
