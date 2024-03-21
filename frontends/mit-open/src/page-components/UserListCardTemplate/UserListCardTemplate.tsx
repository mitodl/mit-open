import React from "react"
import invariant from "tiny-invariant"
import CardTemplate from "../CardTemplate/CardTemplate"
import { UserList } from "api"

type CardVariant = "column" | "row" | "row-reverse"
type UserListCardTemplateProps<U extends UserList = UserList> = {
  /**
   * Whether the course picture and info display as a column or row.
   */
  variant: CardVariant
  userList: U
  sortable?: boolean
  className?: string
}

const UserListCardTemplate = <R extends UserList>({
  variant,
  userList,
  className,
  sortable = false,
}: UserListCardTemplateProps<R>) => {
  invariant(
    !sortable || variant === "row-reverse",
    "sortable only supported for variant='row-reverse'",
  )

  return (
    <CardTemplate
      variant={variant}
      className={className}
      title={userList.title}
      sortable={sortable}
    ></CardTemplate>
  )
}

export default UserListCardTemplate
export type { UserListCardTemplateProps }
