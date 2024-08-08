---
parent: Architecture
nav_order: 1
---

# Front End Component Structure

Referencing [RFC: Front End Component Structure](../rfcs/0006-front-end-component-structure.md)

## Directory structure and naming

In order to consider our layers and component delineation, let’s first specify a classification and structure for our component units.

We define categories with explicit dependency hierarchy and rules for import that are general and reusable across projects and that all code can belong to.

The category any module belongs to can be unambiguously determined according to clearly defined rules. Within a workspace src, each category is a top level directory with lower kebab-case naming.

- `pages` - React components that are routable.

- `page-components` - These are sub page components that may be routable (React Router nesting) and/or are page sections or areas of functionality that incorporate several components.

- `components` - React components that are specific to mit-learn.

- `services` - any over network dependencies (notably the adaptor for the backend api) and any library initialization.

- `utilities` - any utility code specific to the workspace.

- `common` - any code common to the workspace, typically routing and config etc.

The naming convention for these categories applies both within each workspace and is reused for workspaces themselves with an ol- prefix.

Within `pages`, `page-components` and `components`, as they contain React presentational components, each directory is named in PascalCase (as is the requirement for React component naming) and contains a React component, a single unit test file and any React components unique to it and not imported elsewhere.

The component hierarchy is flat and wide and avoids deeply nested or interwoven dependencies. Taking a directory listing / catalog form, components can be found more easily where there are fewer levels.

## Classification rules

- If a React component is not a top level page, but is routable as a page section and/or needs to import services and has knowledge of its context within the app, it is a `page-component`.

- If a React component is presentable and reusable outside of the app and does not need to import outside of its workspace (except `utilities`), it is a `component`. It can only interact with the containing code through values or functions passed down to it as props.

- `services` are non React components and each service interfaces an API or provides an entry point to a third party service or library.

- `utilities` are non React components and utility code for use across the project.

- If a class of components has special build tasks, exclusive dependency sets it will need its own package.json and therefore qualifies for being an `ol-` workspace. For example, a useful means to present and browse components would be for the components catalog to produce a static HTML site during build ([Storybook](https://storybook.js.org/) or similar). These should therefore live in ol-components (though the utility of workspaces needs discussion).

## Module boundary and import/export rules

- To impose import rules, we define a component hierarchy between categories:

```text
─────────────────────────────────────────────
                    pages
─────────────────────────────────────────────
 page-components       services       common
─────────────────────────────────────────────
         components       utilities
─────────────────────────────────────────────
```

- Files can only import sideways or down the hierarchy, import rules example below.

- Each reusable React component lives in its own directory, exports a single React component and contains any dependencies specific to the component.

- Every file that contains a React component should export a single React component.

- The entrypoint file for each React component has the same name as the directory, e.g. src/Home/Home.tsx. This is less kind on the import statements (repeats ‘Home’), though we are avoiding many index.ts(x) files, which is problematic for editor tabs and searching.

- Files can only import the entrypoint file from each component directory (it is treated as an index file).

- An exception - sometimes it is useful to group similar components. Where there is no single entrypoint, an index.ts file is useful for single line imports and each component should have its own unit test file, see for example the ErrorPages/ below.

- Styles are implemented in TypeScript inside their component files and sass files (scss/\*.scss) are removed in line with [#239](https://github.com/mitodl/mit-learn/issues/239).

## Shared workspaces

Workspaces that can be shared across application root workspaces can follow the same naming for categorization, with an ol- prefix, providing us:

- `ol-page-components` - sub page components that may be routable (React Router nesting) and/or are areas of functionality that form a section of the page and incorporate many components, an in-page comments board, for example. They have knowledge of the application and can import up outside their workspace e.g. to use any ol-components or the api service.

- `ol-components` - a catalog of React presentational components, forming our OL component library. Components can import sideways, but cannot import outside of their workspace. They cannot therefore interact directly with app level services or functionality except where passed to them as functions (handler callbacks, etc).

- `ol-services` - we may want to move any bridges to backend services for reuse in other applications.

- `ol-utilities` - shared utility code.

- `ol-common` - For code common to `mit-learn`, `ol-page-components` and `ol-components`. Used for TypeScript definitions and anything that has visibility of the app or is not a utility or service.

## Import rules example

In this sample project:

```text
├─ project-root
│ ├─ package.json
│ ├─ src
│ │ ├─ App.tsx
│ │ ├─ pages
│ │ │ ├─ ArticlePage
│ │ │ │ ├─ ArticlePage.tsx
│ │ │ ├─ ErrorPages
│ │ │ │ ├─ index.ts
│ │ │ │ ├─ ForbiddenPage.tsx
│ │ │ │ ├─ NotFoundPage.tsx
├─ ol-page-components
│ ├─ package.json
│ ├─ src
│ │ ├─ Article
│ │ │ ├─ Article.tsx
│ │ │ ├─ Article.test.tsx
│ │ ├─ CommentBoard
│ │ │ ├─ CommentBoard.tsx
│ │ │ ├─ CommentBoard.test.tsx
│ │ │ ├─ CommentsList.tsx
├─ ol-components
│ ├─ package.json
│ ├─ src
│ │ ├─ EditableComment
│ │ │ ├─ EditableComment.tsx
│ │ │ ├─ EditableComment.test.tsx
│ │ ├─ SubmitButton
│ │ │ ├─ SubmitButton.tsx
│ │ │ ├─ SubmitButton.test.tsx
├─ ol-services
│ ├─ package.json
│ ├─ src
│ │ ├─ api
│ │ │ ├─ httpClient.ts
├─ ol-utilities
│ ├─ package.json
│ ├─ src
│ │ ├─ index.ts
│ │ ├─ markdownFormatters.ts
```

- project-root components can import from all `ol-\*` packages.

- `ol-page-components` can import from `ol-components`, `ol-services` and `ol-utilities`, but not project-root.

- `ol-components` can only import from other `ol-components` or `ol-utilities`.

- `ol-services` can only import from `ol-utilities`.

- `ol-utilities` cannot import outside its workspace.

- Directories that contain React components should contain a component file with the same name as the directory that exports a single component.

- Files can only import this component, for example, Article.tsx can import CommentBoard.tsx, but not CommentsList.tsx. We should enforce with lint rules:

```typescript
import CommentBoard from “../CommentBoard/CommentBoard”
```

- Each component directory contains a single unit test file which can also only import the single exported component. The directory contents are a single unit for test purposes and the tests should only interface its external API and usage.

Sometimes we will want to group a series of similar components. These should re-export each component in an index file, e.g. project-root/src/pages/ErrorPages/index.ts, and be imported using named imports, e.g.

```typescript
import { ForbiddenPage, NotFoundPage } from “../ErrorPages”
```
