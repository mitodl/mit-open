import React, { useCallback } from "react"
import { BannerPage, MetaTags, useToggle } from "ol-util"
import { GridColumn, GridContainer } from "../../components/layout"
import { CkeditorArticleLazy } from "ol-ckeditor"
import {
  useArticleDetail,
  useArticlePartialUpdate,
  useArticleDestroy,
} from "api/hooks/articles"
import { useHistory, useParams } from "react-router"
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  TextField,
  Container,
} from "ol-design"
import * as Yup from "yup"
import { useFormik } from "formik"
import { articlesView } from "../urls"
import BasicDialog from "../../components/BasicDialog"

import { Article } from "api"

const configOverrides = { placeholder: "Write your article here..." }

type RouteParams = {
  id: string
}

const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required."),
  html: Yup.string().default("").required("Article body is required."),
})

type FormValues = Yup.InferType<typeof postSchema>

type ArticleFormProps = {
  id: Article["id"]
  onSaved?: () => void
  onCancel?: () => void
  onDestroy?: () => void
}

const ArticleForm = ({
  id,
  onDestroy,
  onCancel,
  onSaved,
}: ArticleFormProps) => {
  const [editoryReady, setEditorReady] = useToggle(false)
  const [busy, setBusy] = useToggle(false)
  const editArticle = useArticlePartialUpdate()
  const article = useArticleDetail(id)

  const isReady = editoryReady && !editArticle.isLoading && article.data

  const [confirmationOpen, toggleConfirmationOpen] = useToggle(false)
  const destroyArticle = useArticleDestroy()
  const handleSubmit = useCallback(
    (e: FormValues) => {
      editArticle.mutate({ ...e, id })
      onSaved?.()
    },
    [id, editArticle, onSaved],
  )
  const handleDestroy = useCallback(async () => {
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
        variant="outlined"
        value={formik.values.title}
        onChange={formik.handleChange}
        className="title-field"
        error={!!formik.errors.title}
        helperText={formik.errors.title}
      />
      <FormControl fullWidth sx={{ position: "relative" }}>
        <CkeditorArticleLazy
          fallbackLines={10}
          className="article-editor"
          initialData={article.data?.html}
          onReady={setEditorReady.on}
          onChangeHasPendingActions={setBusy}
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
          <Button
            variant="outlined"
            disabled={!isReady}
            onClick={toggleConfirmationOpen.on}
          >
            Delete
          </Button>
        </Grid>
        <Grid item xs={6} className="form-submission-controls">
          <Button variant="outlined" disabled={!isReady} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" disabled={!isReady || busy} type="submit">
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

const ArticlesEditPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const article = useArticleDetail(id)
  const history = useHistory()
  const returnToViewing = useCallback(
    () => history.push(articlesView(id)),
    [history, id],
  )
  const goHome = useCallback(() => history.push("/"), [history])

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      compactOnMobile
      className="articles-editing-page"
    >
      <MetaTags>
        <title>{`Editing: ${article.data?.title ?? ""}`}</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">
            <ArticleForm
              id={id}
              onCancel={returnToViewing}
              onSaved={returnToViewing}
              onDestroy={goHome}
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default ArticlesEditPage
