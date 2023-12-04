import type { User } from "../types/settings"

const isAuthenticated = (user: User) => user.is_authenticated

const isArticleEditor = (user: User) => user.is_article_editor

/**
 * Thrown when we know something is forbidden without having to make a request.
 */
class ForbiddenError extends Error {}

export { isAuthenticated, isArticleEditor, ForbiddenError }
