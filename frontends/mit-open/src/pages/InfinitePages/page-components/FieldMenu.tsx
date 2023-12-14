import * as React from "react"
import { SimpleMenu, IconButton } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import SettingsIcon from "@mui/icons-material/Settings"
import { FieldChannel } from "@/services/api/fields"
import {
  makeFieldEditPath,
  makeFieldManageWidgetsPath,
} from "../common/infinite-pages-urls"

type SettingsMenuProps = {
  field: FieldChannel
}

const EDIT_FIELD_MENU_ITEMS: SimpleMenuItem<"settings" | "manage_widgets">[] = [
  {
    key: "settings",
    label: "Field Settings",
  },
  {
    key: "manage_widgets",
    label: "Manage Widgets",
  },
]

const FieldMenu: React.FC<SettingsMenuProps> = (props) => {
  const { field } = props
  const actionsOrLinks = {
    settings: makeFieldEditPath(field.name),
    manage_widgets: makeFieldManageWidgetsPath(field.name),
  }

  return field ? (
    <SimpleMenu
      trigger={
        <IconButton aria-label="Settings" className="field-edit-button">
          <SettingsIcon />
        </IconButton>
      }
      items={EDIT_FIELD_MENU_ITEMS}
      actionsOrLinks={actionsOrLinks}
    />
  ) : null
}

export default FieldMenu
