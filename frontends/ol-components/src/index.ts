/// <reference types="./types/theme.d.ts" />

/**
 * Re-exports from MUI.
 *
 * This might expose more props than we want to expose. On the other hand, it
 * means that:
 *  - we get MUI's docstrings
 *  - we don't need to implement ref-forwarding, which is important for some
 *    functionality.
 */

export { default as Avatar } from "@mui/material/Avatar"
export type { AvatarProps } from "@mui/material/Avatar"

export { default as Badge } from "@mui/material/Badge"
export type { BadgeProps } from "@mui/material/Badge"

export { default as AppBar } from "@mui/material/AppBar"
export type { AppBarProps } from "@mui/material/AppBar"

export { Banner } from "./components/Banner/Banner"
export type { BannerProps } from "./components/Banner/Banner"

export {
  Button,
  ActionButton,
  ActionButtonLink,
  ButtonLink,
} from "./components/Button/Button"

export type { ButtonProps, ButtonLinkProps } from "./components/Button/Button"

export { default as MuiCard } from "@mui/material/Card"
export type { CardProps as MuiCardProps } from "@mui/material/Card"
export { default as Box } from "@mui/material/Box"
export type { BoxProps } from "@mui/material/Box"
export { default as CardActions } from "@mui/material/CardActions"
export type { CardActionsProps } from "@mui/material/CardActions"
export { default as CardContent } from "@mui/material/CardContent"
export type { CardContentProps } from "@mui/material/CardContent"
export { default as CardMedia } from "@mui/material/CardMedia"
export type { CardMediaProps } from "@mui/material/CardMedia"

export { default as Checkbox } from "@mui/material/Checkbox"
export type { CheckboxProps } from "@mui/material/Checkbox"

export { default as Chip } from "@mui/material/Chip"
export type { ChipProps } from "@mui/material/Chip"

export { default as ClickAwayListener } from "@mui/material/ClickAwayListener"
export type { ClickAwayListenerProps } from "@mui/material/ClickAwayListener"

export { default as Container } from "@mui/material/Container"
export type { ContainerProps } from "@mui/material/Container"

export { default as Dialog } from "@mui/material/Dialog"
export type { DialogProps } from "@mui/material/Dialog"
export { default as DialogActions } from "@mui/material/DialogActions"
export type { DialogActionsProps } from "@mui/material/DialogActions"
export { default as DialogContent } from "@mui/material/DialogContent"
export type { DialogContentProps } from "@mui/material/DialogContent"
export { default as DialogTitle } from "@mui/material/DialogTitle"
export type { DialogTitleProps } from "@mui/material/DialogTitle"

export { default as Divider } from "@mui/material/Divider"
export type { DividerProps } from "@mui/material/Divider"

export { default as Drawer } from "@mui/material/Drawer"
export type { DrawerProps } from "@mui/material/Drawer"

export { default as Grid } from "@mui/material/Grid"
export type { GridProps } from "@mui/material/Grid"
export { default as InputLabel } from "@mui/material/InputLabel"

export { default as List } from "@mui/material/List"
export type { ListProps } from "@mui/material/List"
export { default as ListItem } from "@mui/material/ListItem"
export type { ListItemProps } from "@mui/material/ListItem"
export { ListItemLink } from "./components/Lists/ListItemLink"
export type { ListItemLinkProps } from "./components/Lists/ListItemLink"
export { default as ListItemButton } from "@mui/material/ListItemButton"
export type { ListItemButtonProps } from "@mui/material/ListItemButton"
export { default as ListItemText } from "@mui/material/ListItemText"
export type { ListItemTextProps } from "@mui/material/ListItemText"

export { default as Skeleton } from "@mui/material/Skeleton"
export type { SkeletonProps } from "@mui/material/Skeleton"

export { default as Stack } from "@mui/material/Stack"
export type { StackProps } from "@mui/material/Stack"

export { default as Tab } from "@mui/material/Tab"
export type { TabProps } from "@mui/material/Tab"

export { default as TabList } from "@mui/lab/TabList"
export type { TabListProps } from "@mui/lab/TabList"

export {
  TabButton,
  TabButtonLink,
  TabButtonList,
} from "./components/TabButtons/TabButtonList"

export { default as TabContext } from "@mui/lab/TabContext"
export type { TabContextProps } from "@mui/lab/TabContext"
export { default as TabPanel } from "@mui/lab/TabPanel"
export type { TabPanelProps } from "@mui/lab/TabPanel"

export { default as Toolbar } from "@mui/material/Toolbar"
export type { ToolbarProps } from "@mui/material/Toolbar"

// Mui Form Inputs
export { default as Autocomplete } from "@mui/material/Autocomplete"
export type { AutocompleteProps } from "@mui/material/Autocomplete"
export { default as Radio } from "@mui/material/Radio"
export type { RadioProps } from "@mui/material/Radio"
export { default as RadioGroup } from "@mui/material/RadioGroup"
export type { RadioGroupProps } from "@mui/material/RadioGroup"
export { default as ToggleButton } from "@mui/material/ToggleButton"
export { default as ToggleButtonGroup } from "@mui/material/ToggleButtonGroup"

// Mui Custom Form Inputs
export { default as FormControl } from "@mui/material/FormControl"
export type { FormControlProps } from "@mui/material/FormControl"
export { default as FormControlLabel } from "@mui/material/FormControlLabel"
export type { FormControlLabelProps } from "@mui/material/FormControlLabel"
export { default as FormHelperText } from "@mui/material/FormHelperText"
export type { FormHelperTextProps } from "@mui/material/FormHelperText"
export { default as FormLabel } from "@mui/material/FormLabel"
export type { FormLabelProps } from "@mui/material/FormLabel"
export { default as Pagination } from "@mui/material/Pagination"
export type { PaginationProps } from "@mui/material/Pagination"
export { default as Typography } from "@mui/material/Typography"
export type { TypographyProps } from "@mui/material/Typography"

export { default as Collapse } from "@mui/material/Collapse"

export { default as Menu } from "@mui/material/Menu"
export type { MenuProps } from "@mui/material/Menu"
export { default as MenuItem } from "@mui/material/MenuItem"

export { default as Stepper } from "@mui/material/Stepper"
export { default as Step } from "@mui/material/Step"
export { default as StepLabel } from "@mui/material/StepLabel"
export type { StepIconProps } from "@mui/material/StepIcon"

export { default as CircularProgress } from "@mui/material/CircularProgress"

export * from "./components/Alert/Alert"
export * from "./components/BasicDialog/BasicDialog"
export * from "./components/BannerPage/BannerPage"
export * from "./components/Card/Card"
export * from "./components/Chips/ChipLink"
export * from "./components/EmbedlyCard/EmbedlyCard"
export * from "./components/FormDialog/FormDialog"
export * from "./components/LearningResourceCard/LearningResourceCard"
export * from "./components/LearningResourceExpanded/LearningResourceExpanded"
export * from "./components/LoadingSpinner/LoadingSpinner"
export * from "./components/Logo/Logo"
export * from "./components/RoutedDrawer/RoutedDrawer"
export * from "./components/NavDrawer/NavDrawer"
export * from "./components/SearchInput/SearchInput"
export * from "./components/SimpleMenu/SimpleMenu"
export * from "./components/SortableList/SortableList"
export * from "./components/ShareTooltip/ShareTooltip"
export * from "./components/Carousel/Carousel"
export * from "./components/PlainList/PlainList"
export * from "./components/TruncateText/TruncateText"
export * from "./components/ThemeProvider/ThemeProvider"
export * from "./components/RadioChoiceField/RadioChoiceField"
export * from "./components/ChoiceBox/ChoiceBox"

export * from "./constants/imgConfigs"

export { Input, AdornmentButton } from "./components/Input/Input"
export type { InputProps, AdornmentButtonProps } from "./components/Input/Input"
export { TextField } from "./components/TextField/TextField"
export { SimpleSelect } from "./components/SimpleSelect/SimpleSelect"
export type {
  SimpleSelectProps,
  SimpleSelectOptionProps,
} from "./components/SimpleSelect/SimpleSelect"

export type { TextFieldProps } from "./components/TextField/TextField"
export { Select, SelectField } from "./components/SelectField/SelectField"
export type {
  SelectChangeEvent,
  SelectProps,
  SelectFieldProps,
} from "./components/SelectField/SelectField"

export { Link, linkStyles } from "./components/Link/Link"
export type { LinkProps } from "./components/Link/Link"

export * from "./hooks/useBreakpoint"

export { default as styled } from "@emotion/styled"
export { css, Global } from "@emotion/react"
