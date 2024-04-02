import React, { useMemo } from "react"
import * as routes from "../../common/urls"
import { SimpleMenu, IconButton } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import SettingsIcon from "@mui/icons-material/Settings"

const FieldMenu: React.FC<{ id: number }> = ({ id }) => {
  const items: SimpleMenuItem[] = useMemo(() => {
    return [
      {
        key: "settings",
        label: "Field Settings",
        href: routes.makeFieldEditPath(id.toString()),
      },
      {
        key: "widget",
        label: "Manage Widgets",
        href: routes.makeFieldManageWidgetsPath(id.toString()),
      },
    ]
  }, [id])
  return (
    <SimpleMenu
      items={items}
      trigger={
        <IconButton sx={{ color: "white" }}>
          <SettingsIcon />
        </IconButton>
      }
    />
  )
}

export default FieldMenu
