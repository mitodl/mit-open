import React, { useMemo } from "react"
import * as routes from "../../common/urls"
import { SimpleMenu, ActionButton, styled } from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import { RiSettingsLine } from "@remixicon/react"

const InvertedButton = styled(ActionButton)({ color: "white" })

const ChannelMenu: React.FC<{ channelType: string; name: string }> = ({
  channelType,
  name,
}) => {
  const items: SimpleMenuItem[] = useMemo(() => {
    return [
      {
        key: "settings",
        label: "Channel Settings",
        href: routes.makeChannelEditPath(channelType, name),
      },
      {
        key: "widget",
        label: "Manage Widgets",
        href: routes.makeChannelManageWidgetsPath(channelType, name),
      },
    ]
  }, [channelType, name])
  return (
    <SimpleMenu
      items={items}
      trigger={
        <InvertedButton variant="text">
          <RiSettingsLine />
        </InvertedButton>
      }
    />
  )
}

export default ChannelMenu
