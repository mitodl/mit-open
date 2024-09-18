import React, { useCallback } from "react"
import { useToggle } from "ol-utilities"
import { CkeditorArticleLazy } from "ol-ckeditor"
import {
  useArticleDetail,
  useArticlePartialUpdate,
  useArticleDestroy,
  useArticleCreate,
} from "api/hooks/articles"
import {
  Button,
  FormHelperText,
  Grid,
  TextField,
  Dialog,
  styled,
} from "ol-components"
import * as Yup from "yup"
import { useFormik } from "formik"
import { Article } from "api"
import invariant from "tiny-invariant"

const configOverrides = { placeholder: "Write your article here..." }

const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required"),
  html: Yup.string().default("").required("Article body is required"),
})

type FormValues = Yup.InferType<typeof postSchema>

const FormFooter = styled(Grid)`
  margin-top: 1rem;
  margin-bottom: 1rem;
`

const FormControls = styled(Grid)`
  display: flex;
  justify-content: flex-end;
  align-items: center;

  > *:not(:last-child) {
    margin-right: 0.5rem;
  }

  > *:not(:first-of-type) {
    margin-left: 0.5rem;
  }
`

type ArticleFormProps = {
  id?: Article["id"]
  onSaved?: (id: number) => void
  onCancel?: () => void
  onDestroy?: () => void
}

const ArticleUpsertForm = ({
  id,
  onDestroy,
  onCancel,
  onSaved,
}: ArticleFormProps) => {
  const [editoryReady, setEditorReady] = useToggle(false)
  const [editorBusy, setEditorBusy] = useToggle(false)
  const editArticle = useArticlePartialUpdate()
  const createArticle = useArticleCreate()
  const article = useArticleDetail(id)

  const hasData = (!id || article.data) && editoryReady

  const [confirmationOpen, toggleConfirmationOpen] = useToggle(false)
  const destroyArticle = useArticleDestroy()
  const handleSubmit = useCallback(
    async (e: FormValues) => {
      let data: Article
      if (id) {
        data = await editArticle.mutateAsync({ ...e, id })
      } else {
        data = await createArticle.mutateAsync({ ...e })
      }
      onSaved?.(data.id)
    },
    [id, editArticle, createArticle, onSaved],
  )
  const handleDestroy = useCallback(async () => {
    invariant(id)
    await destroyArticle.mutateAsync(id)
    toggleConfirmationOpen.off()
    onDestroy?.()
  }, [id, destroyArticle, toggleConfirmationOpen, onDestroy])
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: article.data ?? { title: "", html: "" },
    onSubmit: handleSubmit,
    validationSchema: postSchema,
    validateOnChange: false,
    validateOnBlur: false,
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        name="title"
        label="Title"
        value={formik.values.title}
        onChange={formik.handleChange}
        error={!!formik.errors.title}
        errorText={formik.errors.title}
      />
      <CkeditorArticleLazy
        aria-label="Article body"
        fallbackLines={10}
        className="article-editor"
        initialData={article.data?.html}
        onReady={setEditorReady.on}
        onChangeHasPendingActions={setEditorBusy}
        onChange={(value) => {
          formik.setFieldValue("html", value)
        }}
        config={configOverrides}
      />
      {formik.errors.html ? (
        <FormHelperText error>{formik.errors.html}</FormHelperText>
      ) : null}

      <FormFooter container>
        <Grid item xs={6}>
          {id ? (
            <Button
              variant="secondary"
              disabled={!hasData || destroyArticle.isLoading}
              onClick={toggleConfirmationOpen.on}
            >
              Delete
            </Button>
          ) : null}
        </Grid>
        <FormControls item xs={6}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              editorBusy || createArticle.isLoading || editArticle.isLoading
            }
            type="submit"
          >
            Save
          </Button>
        </FormControls>
      </FormFooter>
      <Dialog
        open={confirmationOpen}
        onClose={toggleConfirmationOpen.off}
        title="Are you sure?"
        onConfirm={handleDestroy}
        confirmText="Yes, delete"
      >
        Are you sure you want to delete {article.data?.title}?
      </Dialog>
    </form>
  )
}

export default ArticleUpsertForm
