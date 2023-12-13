import React, { useCallback } from "react"
import { useToggle } from "ol-util"
import { CkeditorArticleLazy } from "ol-ckeditor"
import {
  useArticleDetail,
  useArticlePartialUpdate,
  useArticleDestroy,
  useArticleCreate,
} from "api/hooks/articles"
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  TextField,
  BasicDialog,
} from "ol-design"
import * as Yup from "yup"
import { useFormik } from "formik"
import { Article } from "api"
import invariant from "tiny-invariant"

const configOverrides = { placeholder: "Write your article here..." }

const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required."),
  html: Yup.string().default("").required("Article body is required."),
})

type FormValues = Yup.InferType<typeof postSchema>

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
      <FormControl fullWidth sx={{ position: "relative" }}>
        <TextField
          name="title"
          label="Title"
          variant="outlined"
          value={formik.values.title}
          onChange={formik.handleChange}
          className="title-field"
          error={!!formik.errors.title}
          helperText={formik.errors.title}
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
      </FormControl>

      <Grid container className="form-footer">
        <Grid item xs={6}>
          {id ? (
            <Button
              variant="outlined"
              disabled={!hasData || destroyArticle.isLoading}
              onClick={toggleConfirmationOpen.on}
            >
              Delete
            </Button>
          ) : null}
        </Grid>
        <Grid item xs={6} className="form-submission-controls">
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              editorBusy || createArticle.isLoading || editArticle.isLoading
            }
            type="submit"
          >
            Save
          </Button>
        </Grid>
      </Grid>
      <BasicDialog
        open={confirmationOpen}
        onClose={toggleConfirmationOpen.off}
        title="Are you sure?"
        onConfirm={handleDestroy}
        confirmText="Yes, delete"
      >
        Are you sure you want to delete {article.data?.title}?
      </BasicDialog>
    </form>
  )
}

export default ArticleUpsertForm
