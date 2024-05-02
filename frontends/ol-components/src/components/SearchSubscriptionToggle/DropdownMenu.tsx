import React from "react"
import onClickOutside from "react-onclickoutside"

type Props = {
  closeMenu: () => void
  children: React.ReactElement
  className?: string
}

class _DropdownMenu extends React.Component<Props> {
  handleClickOutside = () => {
    const { closeMenu } = this.props

    closeMenu()
  }

  // this sets onClickOutside as the onClick prop for
  // all the children, so that the menu will close after
  // an option is selected
  setClickHandlersOnChildren = () => {
    const { closeMenu, children } = this.props

    return React.Children.map(children, (child) =>
      child ? React.cloneElement(child, { onClick: closeMenu }) : child,
    )
  }

  render() {
    const { className } = this.props
    const spaceSeparated = (strings: Array<string>): string =>
      strings.filter((str) => str).join(" ")

    return (
      <ul className={spaceSeparated(["dropdown-menu", className])}>
        {this.setClickHandlersOnChildren()}
      </ul>
    )
  }
}

const DropdownMenu = onClickOutside<Props, void>(_DropdownMenu)
export default DropdownMenu
