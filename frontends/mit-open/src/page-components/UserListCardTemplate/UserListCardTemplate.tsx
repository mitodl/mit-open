import React, { useCallback } from "react"
import CardTemplate from "../CardTemplate/CardTemplate"
import { UserList } from "api"
import { EmbedlyConfig } from "ol-utilities"
import { TypeRow } from "../LearningResourceCardTemplate/LearningResourceCardTemplate"

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
}

const UserListCardTemplate = <U extends UserList>({
  variant,
  userList,
  className,
  imgConfig,
  sortable,
  onActivate,
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
    ></CardTemplate>
  )
}

export default UserListCardTemplate
export type { UserListCardTemplateProps }
