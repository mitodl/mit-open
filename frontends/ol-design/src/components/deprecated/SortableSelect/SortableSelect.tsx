import React, {
  ChangeEvent,
  SyntheticEvent,
  useCallback,
  useState,
} from "react"
import SelectField, { Option } from "./SelectField"
import { default as SortableItemComponent } from "./SortableItem"
import SortWrapper from "./SortWrapper"
import { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

interface SortableItem {
  // the id for this item
  id: UniqueIdentifier
  // title, used to display a sortable entry in the list
  title: string
}

interface SortableSelectProps {
  value: SortableItem[]
  // The onChange function takes an array of item IDs as an argument
  onChange: (update: UniqueIdentifier[]) => void
  options: Option[]
  defaultOptions?: Option[]
  name: string
  loadOptions: (
    inputValue: string,
    callback: (options: Option[]) => void,
  ) => void
  isOptionDisabled?: (option: Option) => boolean
}

/**
 * This is a dropdown field followed by a sortable list of items. The dropdown
 * is used to add new items to the sortable list.
 *
 * @deprecated Avoid using this component. It should be re-built using MUI's
 * Autocomplete component instead of react-select. Using Autocomplete would be
 * more consistent with other components, simpler, and would remove a
 * dependency.
 */
const SortableSelect: React.FC<SortableSelectProps> = (props) => {
  const {
    options,
    loadOptions,
    defaultOptions,
    value,
    onChange,
    name,
    isOptionDisabled,
  } = props

  const [focusedContent, setFocusedContent] = useState<string | undefined>(
    undefined,
  )

  /**
   * Callback for adding a new item to the field value in the sortable UI. If
   * there is an item 'focused' in the UI (i.e. the user has selected it in the
   * SelectField) then we add that to the current value and call the change
   * shim.
   */
  const addFocusedItem = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (focusedContent) {
        onChange(value.map((item) => item.id).concat(focusedContent))
        setFocusedContent(undefined)
      }
    },
    [focusedContent, setFocusedContent, onChange, value],
  )

  const setFocusedContentCB = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setFocusedContent(event.target.value)
    },
    [setFocusedContent],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const valueToUse = value.map((item) => item.id)

        const movedArray = arrayMove(
          valueToUse,
          valueToUse.indexOf(active.id),
          valueToUse.indexOf(over.id),
        )

        onChange(movedArray)
      }
    },
    [onChange, value],
  )

  /**
   * For removing an item in the sortable UI
   */
  const deleteItem = useCallback(
    (toDelete: string) => {
      onChange(value.map((item) => item.id).filter((item) => item !== toDelete))
    },
    [onChange, value],
  )

  return (
    <>
      <div className="d-flex">
        <SelectField
          name={name}
          value={focusedContent}
          onChange={setFocusedContentCB}
          options={options}
          loadOptions={loadOptions}
          defaultOptions={defaultOptions}
          isOptionDisabled={isOptionDisabled}
        />
        <button
          className="px-4 ml-3"
          disabled={focusedContent === undefined}
          onClick={addFocusedItem}
        >
          Add
        </button>
      </div>
      <SortWrapper
        handleDragEnd={handleDragEnd}
        items={value.map((item) => item.id)}
        generateItemID={(x) => x}
      >
        {value.map((item) => (
          <SortableItemComponent
            key={item.id}
            title={item.title}
            id={item.id}
            item={item.id.toString()}
            deleteItem={deleteItem}
          />
        ))}
      </SortWrapper>
    </>
  )
}

export { SortableSelect }
export type { SortableSelectProps, SortableItem }
