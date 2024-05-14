import React, { useMemo } from "react"
import * as routes from "../../common/urls"
import { SimpleMenu, IconButton, styled } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import SettingsIcon from "@mui/icons-material/Settings"

const InvertedButton = styled(IconButton)({ color: "white" })

const FieldMenu: React.FC<{ channelType: string; name: string }> = ({
  channelType,
  name,
}) => {
  const items: SimpleMenuItem[] = useMemo(() => {
    return [
      {
        key: "settings",
        label: "Field Settings",
        href: routes.makeFieldEditPath(channelType, name),
      },
      {
        key: "widget",
        label: "Manage Widgets",
        href: routes.makeFieldManageWidgetsPath(channelType, name),
      },
    ]
  }, [channelType, name])
  return (
    <SimpleMenu
      items={items}
      trigger={
        <InvertedButton variant="text">
          <SettingsIcon />
        </InvertedButton>
      }
    />
  )
}

export default FieldMenu
