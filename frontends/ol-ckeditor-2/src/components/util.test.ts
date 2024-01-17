import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic"
import { PendingActions } from "@ckeditor/ckeditor5-core"
import { renderHook, waitFor } from "@testing-library/react"
import { useOnChangePendingActions } from "./util"

test("useOnChangePendingActions attaches and detaches handlers correctly", async () => {
  const editor = await ClassicEditor.create("<p>Hello world</p>", {
    plugins: [PendingActions],
  })
  const pendingActions = editor.plugins.get("PendingActions")

  const onChange1 = jest.fn()
  const view = renderHook(useOnChangePendingActions, {
    initialProps: { editor, onChange: onChange1 },
  })

  // Fire an action and check that onChangeHasPendingActions is called
  const action1 = pendingActions.add("foo")
  await waitFor(() => {
    expect(onChange1).toHaveBeenCalledWith(true)
  })
  pendingActions.remove(action1)
  await waitFor(() => {
    expect(onChange1).toHaveBeenCalledWith(false)
  })
  onChange1.mockClear()

  // Re-render with a new handler
  // We will check the new handler is called and NOT the old one.
  const onChange2 = jest.fn()
  view.rerender({ editor, onChange: onChange2 })

  const action2 = pendingActions.add("foo")
  await waitFor(() => {
    expect(onChange2).toHaveBeenCalledWith(true)
  })
  pendingActions.remove(action2)
  await waitFor(() => {
    expect(onChange2).toHaveBeenCalledWith(false)
  })
  expect(onChange1).not.toHaveBeenCalled()
})
