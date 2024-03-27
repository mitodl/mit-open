import React, { useCallback } from "react"
import CardTemplate from "../CardTemplate/CardTemplate"
import { UserList } from "api"

type CardVariant = "column" | "row" | "row-reverse"
type OnActivateCard<U extends UserList> = (userList: U) => void
type UserListCardTemplateProps<U extends UserList = UserList> = {
  /**
   * Whether the course picture and info display as a column or row.
   */
  variant: CardVariant
  userList: U
  sortable?: boolean
  className?: string
  onActivate?: OnActivateCard<U>
}

const UserListCardTemplate = <U extends UserList>({
  variant,
  userList,
  className,
  sortable,
  onActivate,
}: UserListCardTemplateProps<U>) => {
  const handleActivate = useCallback(
    () => onActivate?.(userList),
    [userList, onActivate],
  )
  return (
    <CardTemplate
      variant={variant}
      className={className}
      title={userList.title}
      sortable={sortable}
      handleActivate={handleActivate}
    ></CardTemplate>
  )
}

export default UserListCardTemplate
export type { UserListCardTemplateProps }
