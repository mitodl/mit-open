enum Permissions {
  ArticleEditor = "is_article_editor",
  Authenticated = "is_authenticated",
  LearningPathEditor = "is_learning_path_editor",
}

/**
 * Thrown when we know something is forbidden without having to make a request.
 */
class ForbiddenError extends Error {}

export { Permissions, ForbiddenError }
