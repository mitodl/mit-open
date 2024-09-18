---
layout: default
parent: RFCs
nav_order: 6
has_toc: true
---

# RFC: Front End Component Structure

**Author(s)**: Jon Kafton
**Created**: Dec 6, 2023
**Project**: MIT Learn

## Goals

We are exploring options for the component structure for the MIT Learn application front end at [main/frontends](../../frontends). This includes the dependency tree, modularization and file structure for React components and the assets they import. React itself is a library, not a framework, in the sense that it imposes no rules for how an application is structurally laid out.

In settling on a component architecture, these considerations should be taken into account:

- **Hierarchy**: the layers and nesting of components. These should take into account the dependency tree, the path routing, component communication and the DOM hierarchy for presentational components. A deeply nested directory layout should be avoided. React uses one-way data flow where data is always passed from parent child. Functions may be passed for calling up the tree for UI event handlers, though this is best avoided - state that needs to update outside of a component’s encapsulation boundary should live up the hierarchy at the point of common use.

- **Modularization**: A “module” should self-contain its presentational components for structure and style, any business logic and static assets unique to it.

- **Reuse**: Modules should be designed for reusability except where specialized within their context and provide a self documenting API plane and usage comments where necessary. For reuse outside of the MIT Learn project we can consider pushing to an npm repository during CI runs.

- **Generalization**: The component structure should be sufficiently generic for reuse in other React front ends and form best practice guidelines.

## Prior Art

The React app is currently grouped into [package workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) that include:

- **mit-learn**: entrypoint for pages.
- **ol-design**: a React component catalog and entrypoint for all styles and theming.
- **ol-search-ui**: for components related to search.
- **ol-util**: for page level components and utility functions.
- **ol-ckeditor**: to encapsulate the [CKEditor](https://ckeditor.com/), a WYSIWYG editor.
- **ol-widgets**: Rich text / markdown render.
- **ol-learning-resources**: a learning resource card template.

The workspaces are useful for isolating areas of functionality to their concerns and listing dependencies specific to the workspace, while providing the package manager (Yarn) a global view across dependencies for minimizing conflicts. Each workspace package can be imported by name and allows for build, test and run commands specific to each package.

We have previously landed on moving styles adjacent to their React components so that individual components do not have a dependency on app level stylesheets and so that the dependency structure for CSS can follow the same rule as functional and presentational code recommended in the approaches below. Described in [Refactor Sass styles to CSS-in-JS #239](https://github.com/mitodl/mit-learn/issues/239).

## Problem Space

We are missing any coherent guidelines for structuring front end apps that provide rules on where to place components in the directory structure, where to delineate code that constitutes a single reusable module and rules around how and what a module can import within a dependency hierarchy.

In scope are:

- Directory structure
- Code categorization
- Naming conventions
- Logical hierarchy
- Module definition
- Package dependency
- Import rules and restrictions
- Build/CI considerations
- Unit test scope

Concepts may be useful for other frameworks, though these guidelines are specific to React applications.

### Approaches

#### Directory structure and naming

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

#### Classification rules

- If a React component is not a top level page, but is routable as a page section and/or needs to import services and has knowledge of its context within the app, it is a `page-component`.

- If a React component is presentable and reusable outside of the app and does not need to import outside of its workspace (except `utilities`), it is a `component`. It can only interact with the containing code through values or functions passed down to it as props.

- `services` are non React components and each service interfaces an API or provides an entry point to a third party service or library.

- `utilities` are non React components and utility code for use across the project.

- If a class of components has special build tasks, exclusive dependency sets it will need its own package.json and therefore qualifies for being an `ol-` workspace. For example, a useful means to present and browse components would be for the components catalog to produce a static HTML site during build ([Storybook](https://storybook.js.org/) or similar). These should therefore live in ol-components (though the utility of workspaces needs discussion).

#### Module boundary and import/export rules

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

#### Applying to the existing project

Application root workspace (frontends/mit-learn)

Now looking at how to apply these rules to the existing project. For example, the mit-learn workspace may look like:

```text
├─ src
│ ├─ App.tsx
│ ├─ common
│ │ ├─ constants.ts
│ │ ├─ layout.tsx
│ │ ├─ routes.ts
│ │ ├─ urls.ts
│ ├─ components – Presentational components that are specific to
│ │ │ this workspace
│ │ ├─ Header
│ │ │ ├─ Header.tsx
│ │ │ ├─ Header.test.tsx – Unit tests live alongside their component
│ ├─ page-components
│ │ ├─ AddToListDialog – Moved from pages/learningpaths
│ │ │ ├─ AddToListDialog.tsx
│ │ │ ├─ AddToListDialog.test.tsx
│ │ ├─ LearningResourceCard
│ │ │ ├─ LearningResourceCard.tsx
│ │ │ ├─ LearningResourceCard.test.tsx
│ │ ├─ LearningResourceDrawer
│ │ │ ├─ LearningResourceDrawer.tsx
│ │ ├─ ManageListDialogs – In use by both pages and sibling components
│ │ │ ├─ ManageListDialogs.tsx
│ │ ├─ SearchFilter
│ │ │ ├─ SearchFilter.tsx – Only used by SearchPage so could move
│ │ │ as sibling unless/until used elsewhere
│ ├─ pages – Pages should be routable, with exceptions (e.g.
│ │ │ NotFoundPage.tsx)
│ │ ├─ ArticleDetailPage
│ │ │ ├─ ArticleDetailPage.tsx
│ │ │ ├─ ArticleDetailPage.test.tsx
│ │ ├─ ArticleEditPage
│ │ │ ├─ ArticleEditPage.tsx
│ │ │ ├─ ArticleEditPage.test.tsx
│ │ ├─ DemoPage – This is from infinite-pages (legacy?)
│ │ │ ├─ DemoPage.tsx
│ │ │ ├─ DemoPage.test.tsx
│ │ ├─ Home – or HomePage?
│ │ │ ├─ Home.tsx
│ │ │ ├─ Home.test.tsx
│ │ │ ├─ HomePageCarousel.tsx - Only imported by Home so can live adjacent
│ │ ├─ LearningPathDetails
│ │ │ ├─ LearningPathDetails.tsx
│ │ │ ├─ LearningPathDetails.test.tsx
│ │ │ ├─ ItemsListing.tsx – Components used by a single page can live
│ │ │ │ alongside them
│ │ │ ├─ ItemsListing.test.tsx
│ │ ├─ LearningPathListing — LearningPathListing or LearningPathListingPage?
│ │ │ ├─ LearningPathListingPage.tsx
│ │ │ ├─ LearningPathListingPage.test.tsx
│ │ ├─ ErrorPages – Sensible grouping for pages that are similar
│ │ │ ├─ index.ts – Re-export siblings for clean imports
│ │ │ ├─ ErrorPageRedirect.tsx
│ │ │ ├─ ErrorPageRedirect.test.tsx
│ │ │ ├─ ForbiddenPage.tsx
│ │ │ ├─ ForbiddenPage.test.tsx
│ │ │ ├─ ErrorPageRedirect.tsx
│ │ │ ├─ ErrorPageRedirect.test.tsx
│ │ │ ├─ NotFoundPage.tsx
│ │ │ ├─ NotFoundPage.test.tsx
│ ├─ services
│ │ ├─ api – src/api moves here
│ │ │ ├─ ...
│ │ ├─ axios
│ │ │ ├─ axios.ts - src/libs/axios.ts moves here
│ │ ├─ react-query
│ │ │ ├─ react-query.ts - src/libs/react-query.ts moves here
│ │ │ ├─ react-query.test.tsx
```

The structure above includes a number of suggestions:

**Proposing**

- The entry directory and root.tsx file are removed. Currently entry/root.tsx is the entry point, but this reaches back up the tree for App.tsx. The initialization logic in root.tsx can be moved to App.tsx.

- routes.ts and urls.ts moved to common/.

- The style.ts entry and Sass (.scss) files are removed in favor of “CSS-in-JS” (with [Emotion](https://emotion.sh/docs/introduction), [issue #239](https://github.com/mitodl/mit-learn/issues/239)).

- The constants.ts file is moved to common/, leaving utils/ for functionality, not config (we may want a dedicated config directory if this grows).

- components/layout.tsx is moved to common - it is imported to several pages, but not imported by any component directly.

- The components directory is intended to contain all non-page presentation components. The term “component” is loaded in a React app and in thinking about structure generally (package/module/component used somewhat interchangeably), so we may want to use with caution.

- Error pages have an index.ts for re-export.

- We may want to use ‘Page’ in all page filename (Home.tsx → HomePage.tsx), or decide not to, e.g. remove from ErrorPages (NotFoundPage.tsx → NotFound.tsx), though should be consistent.

- The article details component is called ArticlesDetailPage, though the filename is ArticleDetails.tsx. Let’s be consistent on naming/plurals.

- ArticleDetailsPage and ArticleDetailsPage are candidates for grouping, though routable independently so have their own directories above.

- Only the DemoPage from infinite-pages is added above. Contents will need to be structured in alignment - unless these are legacy - remove?

- pages/learningpaths/AddToListDialog.tsx is moved to components as it’s in use both by other components and by pages.

- pages/learningpaths/LearningPathDetails.tsx is moved to its page component. ItemsListing.tsx can live within the page component if it is only to be imported by it.

- LearningPathListingPage.tsx is also moved to its own page component. LearningPathDetails.tsx and LearningPathListingPage.tsx are both routable pages. Do we include the term ‘Page’ in their file and component name?

- The api adaptor and lib initializers have moved to services/, each having their own directory.

#### Shared workspaces

Workspaces that can be shared across application root workspaces can follow the same naming for categorization, with an ol- prefix, providing us:

- `ol-page-components` - sub page components that may be routable (React Router nesting) and/or are areas of functionality that form a section of the page and incorporate many components, an in-page comments board, for example. They have knowledge of the application and can import up outside their workspace e.g. to use any ol-components or the api service.

- `ol-components` - a catalog of React presentational components, forming our OL component library. Components can import sideways, but cannot import outside of their workspace. They cannot therefore interact directly with app level services or functionality except where passed to them as functions (handler callbacks, etc).

- `ol-services` - we may want to move any bridges to backend services for reuse in other applications.

- `ol-utilities` - shared utility code.

- Perhaps there’s a case for ol-pages where a page might be reused in another application, though that tends not to be the case. common is intended for app level files common to the app (routing, etc), so there is no case for an `ol-common`.

- For discussion is whether we want to treat these workspaces as specific to the mit-learn application (they live in its source repository), in which case there is an argument for moving all `page-components`, `components`, `services` and `utilities` in the mit-learn workspace to their respective `ol-` workspace. Inversely, there might not be a case for separate individual workspaces. The distinction can be made on whether each has a need for its own package.json configuration - does it have a distinct set of third party npm dependencies and does it have any separate CI requirements. The `ol-components` workspace, for example, has an additional build step to generate and publish a Storybook site.

```text
├─ ol-components
│ ├─ src
│ │ ├─ BasicDialog
│ │ │ ├─ BasicDialog.tsx
│ │ ├─ ButtonLink
│ │ │ ├─ ButtonLink.tsx
│ │ ├─ ChipLink
│ │ │ ├─ ChipLink.tsx
│ │ ├─ FacetDisplay – Moved from ol-search-ui
│ │ │ ├─ Facet.tsx
│ │ │ ├─ FacetDisplay.tsx
│ │ │ ├─ FacetDisplay.test.tsx
│ │ │ ├─ SearchFacetItem.tsx
│ │ ├─ FormDialog
│ │ │ ├─ FormDialog.tsx
│ │ │ ├─ FormDialog.test.tsx
│ │ ├─ LoadingSpinner
│ │ │ ├─ LoadingSpinner.tsx
│ │ │ ├─ LoadingSpinner.scss
│ │ ├─ MetaTags – Moved from ol-util
│ │ │ ├─ MetaTags.tsx
│ │ ├─ MITLogoLink
│ │ │ ├─ MITLogoLink.tsx
│ │ ├─ PageBanner
│ │ │ ├─ PageBanner.tsx
│ │ ├─ RadioChoiceField
│ │ │ ├─ RadioChoiceField.tsx
│ │ │ ├─ RadioChoiceField.test.tsx
│ │ ├─ RoutedDrawer
│ │ │ ├─ RoutedDrawer.tsx
│ │ │ ├─ RoutedDrawer.test.tsx
│ │ ├─ SearchInput
│ │ │ ├─ SearchInput.tsx
│ │ │ ├─ SearchInput.test.tsx
│ │ ├─ SearchFilterDrawer – Moved from ol-search-ui
│ │ │ ├─ SearchFilterDrawer.tsx
│ │ ├─ SimpleMenu
│ │ │ ├─ SimpleMenu.tsx
│ │ │ ├─ SimpleMenu.test.tsx
│ │ ├─ SortableList
│ │ │ ├─ SortableList.tsx
│ │ │ ├─ SortableList.test.tsx
│ │ ├─ ThemeProvider
│ │ │ ├─ ThemeProvider.tsx
│ │ ├─ TitledCarousel
│ │ │ ├─ TitledCarousel.tsx
│ │ │ ├─ TitledCarousel.test.tsx
├─ ol-page-components
│ ├─ src
│ │ ├─ LearningResourceCardTemplate – Moved from ol-search-ui
│ │ │ ├─ LearningResourceCardTemplate.tsx
│ │ │ ├─ LearningResourceCardTemplate.test.tsx
├─ ol-design
├─ ol-learning-resources
├─ ol-search-ui
```

**Proposing**

- `ol-components` replaces the existing `ol-design`.

- The `ol-components` catalog should be publishable outside of the Git repo for reuse in other projects. In likelihood this involves publishing to a package repository (npm or GitHub Packages). We’ll want to publish a static site for presenting components using Storybook or similar. We may want to consider publishing individual components - in any case, the components should be individually tree-shakeable during build.

- src/index.ts is removed as we are encouraging use of the catalog irrespective of any design system it may be built on. This means any catalog component should be imported directly and there is no need to re-export MUI where it can be imported directly.

- React components within `ol-util` are moved to `ol-components` (MetaTags, MITLogoLink, PageBanner, SortableList, TitledCarousel).

- Not shown above, though `ol-learning-resources` and `ol-search-ui` should be absorbed into `ol-components`.

- We should consider moving our component catalog outside of the mit-learn Git repo to encourage reuse outside of the project.

#### Large shared components

Some components are large, contain a lot of functionality or can be considered a “mini app” for embedding within root applications. It may not necessarily be only their size that qualifies them for different treatment - perhaps they have special build chains, are not built on React, or have other requirements. The example in the project is the CKEditor, a rich text editor that has its own workspace, ol-ckeditor, in which we wrap and configure it for use in our application.

These will always have their own package.json (as a defining factor), so are publishable independently to a package repository and should be, for reuse outside the project. To contain these and prevent our top level directories from sprawling, let’s introduce an ol-packages workspace that constitutes our npm packages library. Each of its child directories may contain a workspace of its own.

```text
├─ ol-packages
│ ├─ ol-ckeditor – moved from top level
│ │ ├─ ...
│ ├─ ol-editable-widget – previously ol-widgets
│ │ ├─ ...
│ ├─ ol-rich-text-widget – abstracted from ol-widgets
│ │ ├─ ...
│ ├─ ol-embedded-url-widget – abstracted from ol-widgets
│ │ ├─ ...
```

**Proposing**

- An `ol-packages` workspace is created to contain npm packages.

- `ol-ckeditor` is moved to the new workspace.

- `ol-widgets` is renamed and moved to ol-packages/ol-editable-widget. This one could be broken down, abstracting the rich text and embedded URL components. ol-editable-widget would wrap these, providing the editability, API and edit mode switching.

- We should consider moving our packages library outside of the mit-learn Git repo to encourage reuse outside of the project.

### Import rules example

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

#### Reference

The current structure as of November 2023, for reference:

```text
├── api
│ ├── jest.config.ts
│ ├── package.json
│ ├── src
│ │ ├── axios.ts
│ │ ├── clients.ts
│ │ ├── generated ... generated by OpenAPITools
│ │ │ ├── api.ts
│ │ │ ├── base.ts
│ │ │ ├── common.ts
│ │ │ ├── configuration.ts
│ │ │ └── index.ts
│ │ ├── hooks
│ │ │ ├── articles
│ │ │ │ ├── index.ts
│ │ │ │ └── keyFactory.ts
│ │ │ ├── learningResources
│ │ │ │ ├── index.ts
│ │ │ │ └── keyFactory.ts
│ │ │ └── test-utils.tsx
│ │ └── test-utils
│ │ ├── factories
│ │ │ ├── articles.ts
│ │ │ ├── index.ts
│ │ │ └── learningResources.ts
│ │ ├── index.ts
│ │ ├── mockAxios.ts
│ │ ├── setupJest.ts
│ │ └── urls.ts
│ └── tsconfig.json
├── mit-learn ... main entry point
│ ├── build
│ │ ├── 849-39e75af43e94d713.js
│ │ ├── 849-39e75af43e94d713.js.LICENSE.txt
│ │ ├── 849-39e75af43e94d713.js.map
│ │ ├── report.html
│ │ ├── root-95d779c0a7e578a5.js
│ │ ├── root-95d779c0a7e578a5.js.LICENSE.txt
│ │ ├── root-95d779c0a7e578a5.js.map
│ │ ├── root-ad3c098bafc53674.css
│ │ ├── root-ad3c098bafc53674.css.map
│ │ ├── style-71fecb7b21cfed39.css
│ │ ├── style-71fecb7b21cfed39.css.map
│ │ └── style-ffd858ebf65f2695.js
│ ├── jest.config.ts
│ ├── package.json
│ ├── postcss.config.js
│ ├── src
│ │ ├── api
│ │ │ ├── fields
│ │ │ │ ├── factories.ts
│ │ │ │ ├── hooks.ts
│ │ │ │ ├── index.ts
│ │ │ │ ├── interfaces.ts
│ │ │ │ └── urls.ts
│ │ │ ├── learning-resources
│ │ │ │ ├── favorites.ts
│ │ │ │ ├── index.ts
│ │ │ │ ├── resourceLists.ts
│ │ │ │ ├── resources.ts
│ │ │ │ ├── search.ts
│ │ │ │ ├── urls.ts
│ │ │ │ └── util.ts
│ │ │ └── widgets
│ │ │ ├── hooks.ts
│ │ │ ├── index.ts
│ │ │ └── urls.ts
│ │ ├── App.tsx
│ │ ├── components
│ │ │ ├── Header.tsx
│ │ │ ├── layout.tsx
│ │ │ ├── LearningResourceCard.tsx
│ │ │ ├── LearningResourceDrawer.tsx
│ │ │ └── SearchFilter.tsx
│ │ ├── entry
│ │ │ ├── root.tsx
│ │ │ └── style.ts
│ │ ├── infinite-pages ... legacy, migrated from "infinite corridor", an experimental project summer 2022
│ │ │ ├── DemoPage.tsx
│ │ │ ├── field-details
│ │ │ │ ├── components
│ │ │ │ │ ├── FieldAvatar.tsx
│ │ │ │ │ └── FieldMenu.tsx
│ │ │ │ ├── EditFieldAppearanceForm.tsx
│ │ │ │ ├── EditFieldBasicForm.tsx
│ │ │ │ ├── EditFieldPage.tsx
│ │ │ │ ├── FieldAdminApp.tsx
│ │ │ │ ├── FieldPage.tsx
│ │ │ │ ├── FieldPageSkeleton.tsx
│ │ │ │ └── WidgetsList.tsx
│ │ │ ├── routes.ts
│ │ │ ├── SearchPage.tsx
│ │ │ └── urls.ts
│ │ ├── libs
│ │ │ ├── axios.ts
│ │ │ └── react-query.ts
│ │ ├── pages
│ │ │ ├── articles
│ │ │ │ ├── ArticleDetailsPage.tsx
│ │ │ │ └── ArticlesEditPage.tsx
│ │ │ ├── errors
│ │ │ │ ├── ErrorPageRedirect.tsx
│ │ │ │ ├── ForbiddenPage.tsx
│ │ │ │ └── NotFoundPage.tsx
│ │ │ ├── Home.tsx
│ │ │ ├── learningpaths
│ │ │ │ ├── AddToListDialog.tsx
│ │ │ │ ├── ItemsListing.tsx
│ │ │ │ ├── LearningPathDetails.tsx
│ │ │ │ ├── LearningPathListingPage.tsx
│ │ │ │ └── ManageListDialogs.tsx
│ │ │ ├── routes.ts
│ │ │ └── urls.ts
│ │ ├── scss
│ │ │ ├── admin.scss
│ │ │ ├── articles.scss
│ │ │ ├── buttons.scss
│ │ │ ├── combined.scss
│ │ │ ├── demopage.scss
│ │ │ ├── fieldpage.scss
│ │ │ ├── form.scss
│ │ │ ├── header.scss
│ │ │ ├── homepage.scss
│ │ │ ├── layout.scss
│ │ │ ├── learning-resources.scss
│ │ │ ├── learningpaths.scss
│ │ │ ├── main-search.scss
│ │ │ ├── mui.scss
│ │ │ ├── searchpage.scss
│ │ │ ├── theme.scss
│ │ │ └── widgets.scss
│ │ ├── test-utils
│ │ │ ├── factories.ts
│ │ │ ├── index.tsx
│ │ │ ├── mockAxios.ts
│ │ │ ├── setupJest.ts
│ │ │ └── withLocation.ts
│ │ ├── types
│ │ │ └── settings.d.ts
│ │ └── util
│ │ └── constants.ts
│ ├── tsconfig.json
│ └── webpack.config.js
├── ol-ckeditor
│ ├── assets
│ │ └── vendor
│ │ └── ckeditor_content_styles.scss
│ ├── jest.config.ts
│ ├── node_modules
│ │ ├── axios
│ │ │ ├── CHANGELOG.md
│ │ │ ├── dist
│ │ │ │ ├── axios.js
│ │ │ │ ├── axios.js.map
│ │ │ │ ├── axios.min.js
│ │ │ │ ├── axios.min.js.map
│ │ │ │ ├── browser
│ │ │ │ │ ├── axios.cjs
│ │ │ │ │ └── axios.cjs.map
│ │ │ │ ├── esm
│ │ │ │ │ ├── axios.js
│ │ │ │ │ ├── axios.js.map
│ │ │ │ │ ├── axios.min.js
│ │ │ │ │ └── axios.min.js.map
│ │ │ │ └── node
│ │ │ │ ├── axios.cjs
│ │ │ │ └── axios.cjs.map
│ │ │ ├── index.d.cts
│ │ │ ├── index.d.ts
│ │ │ ├── index.js
│ │ │ ├── lib
│ │ │ │ ├── adapters
│ │ │ │ │ ├── adapters.js
│ │ │ │ │ ├── http.js
│ │ │ │ │ ├── README.md
│ │ │ │ │ └── xhr.js
│ │ │ │ ├── axios.js
│ │ │ │ ├── cancel
│ │ │ │ │ ├── CanceledError.js
│ │ │ │ │ ├── CancelToken.js
│ │ │ │ │ └── isCancel.js
│ │ │ │ ├── core
│ │ │ │ │ ├── Axios.js
│ │ │ │ │ ├── AxiosError.js
│ │ │ │ │ ├── AxiosHeaders.js
│ │ │ │ │ ├── buildFullPath.js
│ │ │ │ │ ├── dispatchRequest.js
│ │ │ │ │ ├── InterceptorManager.js
│ │ │ │ │ ├── mergeConfig.js
│ │ │ │ │ ├── README.md
│ │ │ │ │ ├── settle.js
│ │ │ │ │ └── transformData.js
│ │ │ │ ├── defaults
│ │ │ │ │ ├── index.js
│ │ │ │ │ └── transitional.js
│ │ │ │ ├── env
│ │ │ │ │ ├── classes
│ │ │ │ │ │ └── FormData.js
│ │ │ │ │ ├── data.js
│ │ │ │ │ └── README.md
│ │ │ │ ├── helpers
│ │ │ │ │ ├── AxiosTransformStream.js
│ │ │ │ │ ├── AxiosURLSearchParams.js
│ │ │ │ │ ├── bind.js
│ │ │ │ │ ├── buildURL.js
│ │ │ │ │ ├── callbackify.js
│ │ │ │ │ ├── combineURLs.js
│ │ │ │ │ ├── cookies.js
│ │ │ │ │ ├── deprecatedMethod.js
│ │ │ │ │ ├── formDataToJSON.js
│ │ │ │ │ ├── formDataToStream.js
│ │ │ │ │ ├── fromDataURI.js
│ │ │ │ │ ├── HttpStatusCode.js
│ │ │ │ │ ├── isAbsoluteURL.js
│ │ │ │ │ ├── isAxiosError.js
│ │ │ │ │ ├── isURLSameOrigin.js
│ │ │ │ │ ├── null.js
│ │ │ │ │ ├── parseHeaders.js
│ │ │ │ │ ├── parseProtocol.js
│ │ │ │ │ ├── readBlob.js
│ │ │ │ │ ├── README.md
│ │ │ │ │ ├── speedometer.js
│ │ │ │ │ ├── spread.js
│ │ │ │ │ ├── throttle.js
│ │ │ │ │ ├── toFormData.js
│ │ │ │ │ ├── toURLEncodedForm.js
│ │ │ │ │ ├── validator.js
│ │ │ │ │ └── ZlibHeaderTransformStream.js
│ │ │ │ ├── platform
│ │ │ │ │ ├── browser
│ │ │ │ │ │ ├── classes
│ │ │ │ │ │ │ ├── Blob.js
│ │ │ │ │ │ │ ├── FormData.js
│ │ │ │ │ │ │ └── URLSearchParams.js
│ │ │ │ │ │ └── index.js
│ │ │ │ │ ├── index.js
│ │ │ │ │ └── node
│ │ │ │ │ ├── classes
│ │ │ │ │ │ ├── FormData.js
│ │ │ │ │ │ └── URLSearchParams.js
│ │ │ │ │ └── index.js
│ │ │ │ └── utils.js
│ │ │ ├── LICENSE
│ │ │ ├── MIGRATION_GUIDE.md
│ │ │ ├── package.json
│ │ │ ├── README.md
│ │ │ └── SECURITY.md
│ │ └── follow-redirects
│ │ ├── debug.js
│ │ ├── http.js
│ │ ├── https.js
│ │ ├── index.js
│ │ ├── LICENSE
│ │ ├── package.json
│ │ └── README.md
│ ├── package.json
│ ├── src
│ │ ├── components
│ │ │ ├── CkeditorArticle.tsx
│ │ │ ├── CkeditorDisplay.tsx
│ │ │ ├── CkeditorMarkdown.tsx
│ │ │ ├── cloudServices.ts
│ │ │ ├── lazyEditors.tsx
│ │ │ ├── LoadingText.tsx
│ │ │ └── util.ts
│ │ ├── index.ts
│ │ ├── setupJest.ts
│ │ ├── styles.scss
│ │ ├── test_utils.tsx
│ │ ├── types
│ │ │ └── settings.d.ts
│ │ └── webpack-utils.js
│ └── tsconfig.json
├── ol-design
│ ├── jest.config.ts
│ ├── package.json
│ ├── src
│ │ ├── components
│ │ │ ├── BasicDialog.tsx
│ │ │ ├── ButtonLink.tsx
│ │ │ ├── ChipLink.tsx
│ │ │ ├── deprecated
│ │ │ │ ├── index.ts
│ │ │ │ └── SortableSelect
│ │ │ │ ├── SelectField.tsx
│ │ │ │ ├── SortableItem.scss
│ │ │ │ ├── SortableItem.tsx
│ │ │ │ ├── SortableSelect.tsx
│ │ │ │ └── SortWrapper.tsx
│ │ │ ├── FormDialog.tsx
│ │ │ ├── LoadingSpinner.scss
│ │ │ ├── LoadingSpinner.tsx
│ │ │ ├── RadioChoiceField.tsx
│ │ │ ├── RoutedDrawer.tsx
│ │ │ ├── SearchInput.tsx
│ │ │ ├── SimpleMenu.tsx
│ │ │ └── ThemeProvider.tsx
│ │ ├── hooks
│ │ │ └── useBreakpoint.ts
│ │ └── index.ts
│ └── tsconfig.json
├── ol-learning-resources
│ ├── assets
│ │ └── learning-resource-card-template.scss
│ ├── jest.config.ts
│ ├── package.json
│ ├── src
│ │ ├── components
│ │ │ └── LearningResourceCardTemplate.tsx
│ │ ├── index.ts
│ │ ├── test-utils
│ │ │ └── factories.ts
│ │ └── utils
│ │ └── index.ts
│ └── tsconfig.json
├── ol-search-ui
│ ├── assets
│ │ ├── learning-resource-card.scss
│ │ └── learning-resource-drawer.scss
│ ├── jest.config.ts
│ ├── package.json
│ ├── src
│ │ ├── components
│ │ │ ├── ExpandedLearningResourceDisplay.tsx
│ │ │ ├── Facet.tsx
│ │ │ ├── FacetDisplay.tsx
│ │ │ ├── index.ts
│ │ │ ├── LearningResourceCardTemplate.tsx
│ │ │ ├── SearchFacetItem.tsx
│ │ │ ├── SearchFilter.tsx
│ │ │ ├── SearchFilterDrawer.tsx
│ │ │ ├── ShareTooltip.tsx
│ │ │ └── TruncatedText.tsx
│ │ ├── factories.ts
│ │ ├── index.ts
│ │ ├── interfaces.ts
│ │ ├── styled.d.ts
│ │ ├── types
│ │ │ └── settings.d.ts
│ │ └── util.tsx
│ └── tsconfig.json
├── ol-template
│ ├── package.json
│ ├── plop-templates
│ │ └── package
│ │ ├── jest.config.ts.hbs
│ │ ├── package.json.hbs
│ │ ├── src
│ │ │ └── index.ts.hbs
│ │ └── tsconfig.json
│ ├── plopfile.js
│ ├── src
│ │ └── index.ts
│ └── tsconfig.json
├── ol-util
│ ├── assets
│ │ ├── breakpoint.scss
│ │ └── sortable.scss
│ ├── jest.config.ts
│ ├── package.json
│ ├── README.md
│ ├── src
│ │ ├── components
│ │ │ ├── embedly
│ │ │ │ ├── EmbedlyCard.tsx
│ │ │ │ ├── index.ts
│ │ │ │ └── util.ts
│ │ │ ├── index.ts
│ │ │ ├── MetaTags.tsx
│ │ │ ├── MITLogoLink.tsx
│ │ │ ├── PageBanner.tsx
│ │ │ ├── SortableList.tsx
│ │ │ └── TitledCarousel.tsx
│ │ ├── factories.ts
│ │ ├── hooks
│ │ │ ├── index.ts
│ │ │ ├── useResponsive.ts
│ │ │ ├── useSearchParams.ts
│ │ │ └── useToggle.ts
│ │ ├── index.ts
│ │ ├── interfaces.ts
│ │ ├── lib
│ │ │ ├── index.ts
│ │ │ └── utils.ts
│ │ ├── predicates.ts
│ │ ├── querystrings.ts
│ │ ├── styles
│ │ │ ├── colors.ts
│ │ │ ├── index.ts
│ │ │ └── media.ts
│ │ ├── test-utils
│ │ │ ├── ControlledPromise.ts
│ │ │ ├── filemock.js
│ │ │ ├── index.ts
│ │ │ └── svgmock.js
│ │ └── types
│ │ └── settings.d.ts
│ ├── styled-theme.d.ts
│ └── tsconfig.json
├── ol-widgets
│ ├── assets
│ │ └── widgets.scss
│ ├── jest.config.ts
│ ├── package.json
│ ├── src
│ │ ├── components
│ │ │ ├── editing
│ │ │ │ ├── index.tsx
│ │ │ │ ├── interfaces.ts
│ │ │ │ ├── ManageWidgetDialog.tsx
│ │ │ │ ├── MarkdownEditor.tsx
│ │ │ │ ├── schemas.tsx
│ │ │ │ ├── UrlField.tsx
│ │ │ │ ├── widgetFields.tsx
│ │ │ │ └── WidgetsListEditable.tsx
│ │ │ ├── EmbeddedUrlWidgetContent.tsx
│ │ │ ├── index.ts
│ │ │ ├── RichTextWidgetContent.tsx
│ │ │ └── Widget.tsx
│ │ ├── constants.ts
│ │ ├── factories.ts
│ │ ├── index.ts
│ │ ├── interfaces.ts
│ │ ├── setupJest.ts
│ │ └── types
│ │ └── settings.d.ts
│ └── tsconfig.json
└── README.md
```
