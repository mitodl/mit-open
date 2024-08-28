Release Notes
=============

Version 0.18.0
--------------

- Add caching for imagekit (#1472)
- [pre-commit.ci] pre-commit autoupdate (#1215)
- Update redis Docker tag to v7 (#1261)

Version 0.17.9 (Released August 28, 2024)
--------------

- Update newrelic agent (#1464)
- Update actions/upload-artifact digest to 834a144 (#1396)
- Update snok/install-poetry digest to 76e04a9 (#1397)
- Update dependency ruff to v0.6.2 (#1426)
- Carousel accessibility improvements (#1462)
- Add search mode selector to admin (#1456)
- Update Python to v3.12.5 (#1398)
- Sloan ETL pipeline (#1394)
- Setup codespaces (#1444)
- fix certification search url (#1460)
- randomize the hero image (#1459)

Version 0.17.8 (Released August 26, 2024)
--------------

- search box adornment buttons should be 56px wide on mobile (#1457)
- homepage hero search updates (#1454)
- Fix departments and schools fixtures (#1453)
- Renaming the s3 buckets used for storing the app. (#1455)

Version 0.17.7 (Released August 21, 2024)
--------------

- Add SP as a department  (#1451)
- adding test for redirect view (#1448)
- News and events for MIT Professional Education (#1365)

Version 0.17.6 (Released August 21, 2024)
--------------

- change default og:image (#1449)

Version 0.17.5 (Released August 21, 2024)
--------------

- restorin g redirect route (#1446)

Version 0.17.4 (Released August 21, 2024)
--------------

- update departments fixture (#1439)
- department is optional (#1437)
- restrict learning path pages to learning path editors (#1442)
- remove privacy chip from add to user list dialog (#1440)

Version 0.17.3 (Released August 21, 2024)
--------------

- allow empty APPZI_URL (#1441)
- Get availability value from xpro api (#1432)
- add appzi for feedback (#1435)
- Fix frontend sentry_env and release version (#1386)
- Remove remaining frontend routes (#1424)
- Only process best/next run contentfiles, and make sure other run contentfiles are deindexed (#1383)

Version 0.17.2 (Released August 20, 2024)
--------------

- Add locust load testing (#1422)

Version 0.17.1 (Released August 19, 2024)
--------------

- Replace topic chips with info section text (#1379)
- Handle topics with colons from xpro in ETL pipeline (#1429)
- Set default sort to featured (#1414) (#1423)

Version 0.17.0 (Released August 19, 2024)
--------------

- Add migration to adjust mappings, make some minor changes to the dump to yaml util function (#1408)
- uncapitalize with (#1428)
- Update nginx Docker tag to v1.27.1 (#1425)
- search query clean up (#1393)
- remove elementary / primary school as an education option (#1415)
- Per Page metadata tags  (#1411)

Version 0.16.1 (Released August 15, 2024)
--------------

- set csrf cookie name from env var (#1420)
- Expose the SESSION_COOKIE_NAME setting (#1418)
- Update the ETL pipelines times (#1416)
- Add accessibility linting (#1395)
- Undo Change to default sort (#1414)
- Make MITOL_ settings optional in app.json (#1412)
- Rename the variables on release workflows (#1409)
- Fix typo in env variable prefix (#1406)
- cache learning resources search api view (#1392)
- rename MIT Open to MIT Learn (#1389)
- Rename env var prefix MITOPEN_ to MITOL_ (#1388)
- adding fix for logo in email (#1404)
- Change Default sort to featured (#1377)
- Empty user list items view (#1376)

Version 0.16.0 (Released August 13, 2024)
--------------

- Update values of hostnames to use learn.mit.edu (#1401)
- Add featured ranks to the opensearch index (#1381)
- Fix homepage contrast issues (#1371)
- copy update for mitx channel page (#1400)
- Update Yarn to v4.4.0 (#1399)
- Update search term event handler to clear page if the term changes and is submitted, updating tests for this (#1387)
- fix prettier and eslint in pre-commit (#1391)
- Rename MIT Open to MIT Learn for subscription emails (#1390)
- enable mailgun and analytics (#1370)
- update suppport email (#1385)
- Update topic boxes to support multiple lines (#1380)
- Update dependency Django to v4.2.15 [SECURITY] (#1384)
- adding version specifier for renovate (#1378)
- Create, Edit and Delete User List modal UI (#1356)

Version 0.15.1 (Released August 07, 2024)
--------------

- Update dependency redis to v5 (#1244)
- sort before comparing (#1372)
- Rename my 0008 to 0009 to prevent conflict (#1374)
- Add Manufacturing topic; update upserter to make adding child topics easier (#1364)
- Publish topic channels based on resource count (#1349)
- Update dependency opensearch-dsl to v2 (#1242)
- Update dependency opensearch-py to v2 (#1243)
- Fix issue with User List cards not updating on edit (#1361)
- Update dependency django-anymail to v11 (#1207)
- Update CI to check data migrations for conflicts (#1368)
- Fix frontend sentry configuration (#1362)
- Migrate config renovate.json (#1367)
- Update dependency sentry-sdk to v2 [SECURITY] (#1366)
- add a bullet about collecting demographics to PrivacyPage.tsx (#1355)
- user list UI updates (#1348)
- Subscription email template updates (#1311)

Version 0.15.0 (Released August 05, 2024)
--------------

- Performance fixes on LR queries (#1303)
- Subscription management page (#1331)
- Add certificate badge to drawer (#1307)
- Lock file maintenance (#1360)
- Update mcr.microsoft.com/playwright Docker tag to v1.45.3 (#1358)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.23 (#1357)

Version 0.14.7 (Released August 01, 2024)
--------------

- Renaming my topic update migration from 0006 to 0007 (#1353)
- Update the mappings for PWT topic "Programming & Coding"  (#1344)

Version 0.14.6 (Released August 01, 2024)
--------------

- Use resource_delete_actions instead of resource.delete directly (#1347)
- Show "Start Anytime" based on resource "availability" property (#1336)
- Handle alternate unique id fields better in load_course (#1342)
- topic / privacy / onboarding / profile copy updates (#1334)

Version 0.14.5 (Released July 31, 2024)
--------------

- Flatten OCW topics so all of them get mapped to PWT topics when running the ETL pipeline (#1343)

Version 0.14.4 (Released July 31, 2024)
--------------

- fix bug (#1340)
- dev mode (#1333)
- Updated designs for the unit page (#1325)
- Avoid course overwrites in program ETL pipelines (#1332)
- Assign mitxonline certificate type from api values (#1335)
- add default yearly_decay_percent (#1330)
- Modal dialog component and styles
- tab widths (#1309)
- Resource availability: backend changes (#1301)
- styling and icon updates (#1316)

Version 0.14.3 (Released July 29, 2024)
--------------

- Remove some styling for topic box names so they wrap, adjusting icons (#1328)
- Lock file maintenance (#1262)
- fix flaky tests (#1324)
- urlencode search_filter (#1326)
- Moves all env vars to global APP_SETTINGS (#1310)
- Remap topic icons according to what's in the topics listing (#1322)
- Fix podcast duration frontend display (#1321)
- Update topics code for PWT topic mappings (#1275)
- Convert durations to ISO8601 format (podcast episodes) (#1317)
- No prices for archived runs or resources w/out certificates (#1305)

Version 0.14.2 (Released July 25, 2024)
--------------

- Reorder where the testimonial displays in the unit/offeror page to fix spacing and background (#1314)
- fix banner background width (#1315)
- fix price display and update vertical cards (#1296)
- Fix channel views test (#1318)
- free section css (#1312)
- Extract department info for mitxonline from correct external API fields (#1308)
- Determine can edit and can sort permission upstream (#1299)

Version 0.14.1 (Released July 24, 2024)
--------------

- Add a database index on FeedEventDetail.event_datetime (#1304)
- Update platform logos (#1302)

Version 0.14.0 (Released July 23, 2024)
--------------

- Save resource prices in a new database model and calculate during ETL/nightly task (#1290)
- set search page size to 20 (#1298)
- Add a slider to prioritize newer resources (#1283)
- Fix bug with background image obscuring search controls (#1293)
- allow hitting local edx datafile in dev mode (#1297)
- fix restricted redirect (#1287)

Version 0.13.23 (Released July 18, 2024)
---------------

- Revert "Fix bug with background image obscuring search controls (#1286)" (#1289)
- Improve channels api performance (#1278)

Version 0.13.22 (Released July 18, 2024)
---------------

- Optimize queries for learning resource APIs
- Fix bug with background image obscuring search controls (#1286)
- Draggable list card styles (#1282)
- Update actions/setup-node digest to 1e60f62 (#1267)
- Update actions/upload-artifact digest to 0b2256b (#1269)
- Update actions/setup-python digest to 39cd149 (#1268)

Version 0.13.21 (Released July 17, 2024)
---------------

- Unit Detail Banner Updates (#1272)
- Shanbady/clicking item routes away from list fix (#1280)
- adding migrations for copy update (#1276)
- Shanbady/ingest sloan events (#1270)
- fix keyboard drag and drop (#1279)
- Use newer Learning Resource list cards in Learning Paths lists (#1256)
- Improve offeror api performance (#1274)
- Shanbady/clicking item routes away from list (#1273)
- refactor profile and onboarding (#1266)
- add a story showing platform logos (#1277)
- Add profile option for silky to settings (#1271)
- Take is_enrollable attribute into account for publish status of edx resources (#1264)
- Update react monorepo to v18.3.1 (#874)

Version 0.13.20 (Released July 17, 2024)
---------------

- Make static/hash.txt served again (#1259)
- Update actions/checkout digest to 692973e (#1263)
- adjust department names (#1253)
- Update eslint-config and friends (#1246)

Version 0.13.19 (Released July 12, 2024)
---------------

- remove erronous export string (#1257)
- Install django-silk nad fix topics api perf (#1250)
- change xpro ETL dict key back (#1252)
- reindexing fixes (#1247)
- Pin dependencies (#1225)
- Plain text news/events titles/authors; standardize html cleanup (#1248)
- Condensed list card components for user lists (#1251)
- Change readable_id values for podcasts and episodes (#1232)
- adjust / refactor channel detail header (#1234)
- use main not "$default-branch" (#1249)
- Update dependency ruff to v0.5.1 (#1241)
- Update dependency Django to v4.2.14 (#1240)

Version 0.13.18 (Released July 10, 2024)
---------------

- Fix logout view (#1236)
- remove manage widgets (#1239)
- Unit and detail page copy updates (#1235)
- Align departments listing colors to designs (#1238)
- resource drawer UI fixes (#1237)
- Remove "Top picks" carousel if no results (#1195)
- fix learning path count, increase item page size (#1230)
- Use ovewrite=True when calling pluggy function from upsert_offered_by (#1227)
- open resources in new tab (#1220)
- extra weight for instructors (#1231)
- Homepage and nav drawer copy edits (#1233)
- Update dependency eslint-plugin-jest to v28 (#1038)
- Only publish enrollable mitxonline courses (#1229)
- Navigation UI fixes (#1228)
- better spacing around pagination component (#1219)
- Update resource drawer text and URL for podcast episodes (#1191)
- resource type (#1222)
- Data fixtures app for loading static fixtures (#1218)
- Webpack build config loads .env files for running outside of Docker (#1221)
- Updates icons to use Remixicons where they don't already (#1157)
- make primary buttons shadowy, remove edge=none (#1213)
- resource category tabs (#1211)
- Fix storybook github pages publishing (#1200)
- Fix and reenable onboarding page tests (#1216)
- Removed nginx serving of frontend locally (#1179)
- Update actions/checkout digest to 692973e (#961)
- Privacy policy updates (#1208)

Version 0.13.17 (Released July 02, 2024)
---------------

- Fix default image height in resource cards (#1212)
- update unit names (#1198)
- Update opensearchproject/opensearch Docker tag to v2.15.0 (#1205)
- Update mcr.microsoft.com/playwright Docker tag to v1.45.0 (#1203)
- Update dependency ruff to v0.5.0 (#1202)
- Update Node.js to v20.15.0 (#1201)
- Shanbady/log out flow (#1199)
- update mitpe unit data (#1194)
- update sloan executive education offerings (#1193)
- adding post logout redirect to keycloak (#1192)
- stop publishing github pages every pr (#1197)
- setting 100px as default width for buttons (#1185)
- Don't display carousel tabs if there's no data to display (#1169)
- Filled vs Unfilled Bookmarks (#1180)
- Square aspect ratio for media resource images (#1183)
- Add resource category to apis (#1188)
- Scroll results into view when paginating (#1189)
- Drawer CSS fixes (#1190)
- Updates to ChoiceBox; Checkbox, Radio components (#1174)

Version 0.13.16 (Released June 28, 2024)
---------------

- adding command to remove old tables (#1186)
- New default image for learning resources (#1136)
- Swap search and login button (#1181)
- Adding the PostHog settings to the "Build frontend" step (#1182)
- facet order (#1171)
- rename field to channel (#1170)
- fixing width of unit page logo for small devices (#1151)

Version 0.13.15 (Released June 27, 2024)
---------------

- fix content file search (#1167)
- Set default ordering by position for userlist and learningresource relationships (#1165)
- fix flaky test (#1168)
- Update favicons (#1153)
- de-flake a test (#1166)
- Shanbady/search page card mobile updates (#1156)
- remove course filter from featured carousel (#1164)
- Update Select and Dropdown components (#1160)
- Adds a separate pane for the filter CTAs, adds an apply button on mobile (#1144)
- Search facet styles and animation (#1143)
- Modifications to api/search filtering with comma values (#1122)
- [pre-commit.ci] pre-commit autoupdate (#1110)
- Update Yarn to v4.3.1 (#1145)

Version 0.13.14 (Released June 26, 2024)
---------------

- better chunk sizes (#1159)
- Use course_description_html field for OCW courses (#1154)
- Update dependency eslint-plugin-mdx to v3 (#1149)
- sort by -views instead (#1158)
- exposing hijack routes via nginx conf (#1152)
- sort the media carousel tabs by "new" (#1155)
- Update dependency faker to v25 (#1150)
- Update codecov/codecov-action action to v4.5.0 (#1148)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.22 (#1147)
- Update dependency ruff to v0.4.10 (#1146)

Version 0.13.13 (Released June 21, 2024)
---------------

- Some copy edits and minor about page styling updates (#1141)
- creating profile automatically for logged in user (#1140)

Version 0.13.12 (Released June 21, 2024)
---------------

- Search facet checkbox and label styles (#1137)
- Applies new fixes for the homepage and unit page testimonial sliders (#1131)
- fixing sort method for panel detail display (#1130)
- add learning materials tab (#1132)

Version 0.13.11 (Released June 21, 2024)
---------------

- about page updates (#1134)

Version 0.13.10 (Released June 20, 2024)
---------------

- Channel page updates (#1126)

Version 0.13.9 (Released June 20, 2024)
--------------

- removing check for live attribute (#1128)
- Shanbady/copy edits for milestone demo (#1125)
- Signup Popover (#1109)
- show podcast_episode in media carousel all (#1123)
- Updates to page titles (#1121)
- Shanbady/minor UI updates (#1118)
- Shanbady/navigation UI fixes (#1119)
- mitx - only ingest published courses (#1102)
- Make resource.prices = most recent published run prices if there is no next run (#1116)
- switch default sort to use popular instead of created on (#1120)
- Fix populate_featured_lists mgmt command (#1097)

Version 0.13.8 (Released June 20, 2024)
--------------

- add is_learning_material filter show courses and programs first in default sort (#1104)
- dashboard my lists style fixes (#1107)
- Updates to learning resource price display (#1108)
- Add profile edit page (#1029)
- Append `/static` to the front of the testimonial marketing card image (#1115)
- two separate search inputs (#1111)

Version 0.13.7 (Released June 18, 2024)
--------------

- Redoing the marketing image selector (#1113)
- Update Python to v3.12.4 (#1035)
- Update the conditional for the marketing image test to drop out if we haven't seen a marketing image at all yet (#1112)
- Update Yarn to v4.3.0 (#1095)
- Homepage Stories & Events layout fixes (#1103)
- Add marketing images to homepage testimonial, fix some styling issues (#1077)
- Contentfile archive comparison fix (#1078)
- Sort run prices on save; make learning resource prices equal "next run" prices (#1085)
- units page fixes (#1083)
- Rename test appropriately and increase the timeout (#1105)
- Fixed typo in the fastly api key secret name. (#1106)
- breadcrumbs component (#1089)
- Update dependency eslint-config-mitodl to v2 (#1037)

Version 0.13.6 (Released June 17, 2024)
--------------

- update course-search-utils (#1100)
- fix safari image stretching, cap image width (#1096)
- excluding users from serializer (#1090)
- All MITx runs should include a price of $0 (#1094)
- Search page styling (#1051)
- fix dashboard home certificate course carousel (#1082)
- Shanbady/browse by topics UI fix (#1081)
- Update OCW unit name in offerors.json (#1084)
- Add -E flag to worker subcommand for sending task events

Version 0.13.5 (Released June 14, 2024)
--------------

- Shanbady/topic channel page header fixes (#1063)
- Learning Resource cards, list view (#1054)

Version 0.13.4 (Released June 14, 2024)
--------------

- Expose thenew user login url as an environment var (#1086)
- Homepage "Personalize" (#1068)
- Revert "Add flag for Celery to send task state change events"
- Adds learner testimonials component for interior pages (#1001)
- Fixing image width and position on the homepage carousel; prefer cover image over avatar if it exists (#1073)
- Add pytest-xdist and use it for CI builds (#1074)
- Update names in offerors.json (#1079)
- Add flag for Celery to send task state change events

Version 0.13.3 (Released June 14, 2024)
--------------

- Adds ScrollRestoration to the spot in the routes; sets it up so it works only if the path change; adds a mit-learn mock for window.scrollTo (#1071)
- Change LOGIN_REDIRECT_URL and LOGOUT_REDIRECT_URL to use the base URL (#1075)
- dashboard home (#1062)

Version 0.13.2 (Released June 13, 2024)
--------------

- Update education options and add to schema (#1069)
- local dev: Read `MITOL_AXIOS_BASE_PATH` from env (#1065)
- Add featured courses carousel to unit channel page (#1059)
- Add ordering to testimonials, adjust view on homepage testimonial carousel (#1067)
- Change channel type and url from "offeror" to "unit" (#1031)
- Update dependency ruff to v0.4.8 (#1036)

Version 0.13.1 (Released June 11, 2024)
--------------

- [pre-commit.ci] pre-commit autoupdate (#1055)
- make slick fail more gracefully when parent width unconstrained (#1060)
- Copies static assets to root build directory (#1053)
- Absolute login return URL (#1052)
- resource card fallback image and alt text fix (#1050)
- pass cardProps to loading state (#1048)
- search prefs learning format as list (#1056)
- Use login redirect URL setting for social auth as well
- Expose the login/logout redirects as an environment variable (#1046)
- homepage hero bug fixes (#1034)

Version 0.13.0 (Released June 10, 2024)
--------------

- adding configurable csrf settings and including withXSRFToken in axio… (#1042)
- Fixing authentication issue, and fixing some filtering and test issues (#1039)
- dashboard menu (#1009)
- Add a setting for CSRF_COOKIE_DOMAIN (#1032)
- Add backpopulate command for user profiles (#1030)
- mitxonline etl v2 api (#1026)
- Carousel Makeover: New tabs and Fixed Width Cards (#1020)
- Update dependency @testing-library/react to v16 (#799)
- Offerer banner UI (#1010)
- Add learner testimonials homepage UI (#916)
- Update dependency @ckeditor/ckeditor5-react to v7 (#997)
- Update dependency django-json-widget to v2 (#998)
- OLL contentfiles (#1008)
- Profile-based search filter preferences (#1017)
- Move Heroku deploy step prior to S3 publish
- Fix bug with onboarding steps not saving (#1024)
- Purge the fastly cache on deploy (#1021)
- Write the commit hash to the frontend build for doof (#1023)
- Point the webpack dev server proxy to the new API subdomain (#1022)
- Learning Resource Card (#1015)
- certification_type (#1018)
- Insert learning_path_parents/user_list_parents values into search results (#992)
- Add channel links to unit cards (#1016)
- [pre-commit.ci] pre-commit autoupdate (#1004)
- Add onboarding ux (#964)
- Style tab components to match figma (#1012)
- Toggle Professional (#1005)
- Absolute URL to backend for login routes (#1011)
- Add nullalbe offerors and channels to the testimonials model/API (#1006)

Version 0.12.1 (Released June 05, 2024)
--------------

- Update profile fields to align to LR data (#1003)
- Shanbady/additional details on offeror channel pages (#975)
- Configure JS bundles to use a separate API domain for backend (#1002)
- units page (#974)
- Add "tertiary" button and align button terminology with Figma (#991)

Version 0.12.0 (Released June 04, 2024)
--------------

- Sortby parameter for news_events (#989)
- Reduce functions occurring under atomic transactions; fix dedupe comparison in load_course function (#984)
- Update nginx Docker tag to v1.27.0 (#996)
- Update Node.js to v20.14.0 (#995)
- Update dependency ruff to v0.4.7 (#993)
- Update mcr.microsoft.com/playwright Docker tag to v1.44.1 (#994)
- More code sharing between search and field pages (#980)
- Certification types for learning resources (#977)
- Revert "Error if using npm to install (#986)" (#990)
- Learning resource drawer design updates (#958)
- Adding the EMBEDLY_KEY to the populated envvars for building the release static assets. (#987)
- Error if using npm to install (#986)
- Fix celerybeat schedule (#985)
- Lock file maintenance (#982)
- extract images for news articles (#973)

Version 0.11.0 (Released May 30, 2024)
--------------

- remove package-lock.json (#978)
- Randomize featured api order by offeror, keep sorting by position (#971)
- Updated hero page (#969)
- Fix flaky test by specifying a sort of program courses in serializer (#972)
- Clean up resource descriptions (#957)
- Fix Featured API requests (#970)
- add the footer & privacy, terms and about us pages (#956)
- Adding call to update program topics during ETL loads (#952)
- Upgrade NukaCarousel to v8 (#960)
- Fix detect-secrets baseline file (#967)
- Update dependency @faker-js/faker to v8 (#797)

Version 0.10.2 (Released May 30, 2024)
--------------

- Update dependency @ckeditor/ckeditor5-dev-utils to v40 (#933)
- Topics Listing Page (#946)
- Do not ingest prolearn courses/programs from the past (#955)
- Update dependency @ckeditor/ckeditor5-dev-translations to v40 (#932)
- add All tab (#966)
- fix flaky test (#965)
- [pre-commit.ci] pre-commit autoupdate (#963)
- Update codecov/codecov-action action to v4.4.1 (#962)
- Featured Courses Carousel (#959)
- horizontal facets (#949)
- workflow changes to publish static assets to s3 (#922)
- daily subscription email to subscribers (#937)
- Filtering by free=true should exclude all professional courses (#948)
- Fix flaky test (#954)

Version 0.10.1 (Released May 24, 2024)
--------------

- Homepage News and Events section (#945)
- side nav updates (#951)
- Remove 3 offerors and provide featured resources from all remaining ones (#943)
- Additional offeror details (#923)

Version 0.10.0 (Released May 23, 2024)
--------------

- Update dependency django-ipware to v7 (#935)
- fix install and storybook (#942)
- Fixes button styles to match design (#941)
- header updates (#910)
- Update dependency django-imagekit to v5 (#934)
- [pre-commit.ci] pre-commit autoupdate (#938)
- Work on onboarding updates to profile API (#907)
- Fix several ETL bugs (#939)
- Add Free, Certification, and Professional Facets to Search UI (#917)
- use docker profiles, mount root to watch (#936)
- serve static react app for django 40x (#911)
- Update postgres Docker tag to v12.19 (#931)
- Update opensearchproject/opensearch Docker tag to v2.14.0 (#930)
- Update mcr.microsoft.com/playwright Docker tag to v1.44.0 (#929)
- Update dependency drf-nested-routers to ^0.94.0 (#928)
- Update Node.js to v20.13.1 (#926)
- Update codecov/codecov-action action to v4.4.0 (#927)
- Update dependency ruff to v0.4.4 (#925)
- Update dependency Django to v4.2.13 (#924)
- Browse by Topics section for the home page (#901)
- Fix schema for news_events feed items (#919)

Version 0.9.14 (Released May 20, 2024)
--------------

- Fix schema issue that was breaking redoc (#920)
- Fix flaky python test (#912)
- adding fix for program letter route in nginx (#914)
- Give video/podcast/learning_path resources a default learning format of ["online"] (#892)
- Fix schema generation errors (#895)
- Button Updates (#915)
- Pin actions/upload-artifact action to 6546280 (#868)
- Use our ActionButton, no more MUI IconButton (#909)
- Update Python to v3.12.3 (#349)
- Update Yarn to v4.2.2 (#897)
- Update dependency django-cors-headers to v4 (#840)
- Handle nulls in attestation cover field (#906)
- navigation menu (#890)

Version 0.9.13 (Released May 16, 2024)
--------------

- Adds learner testimonials support (#891)
- Null start dates for OCW course runs (#899)
- Featured API endpoint (#887)

Version 0.9.12 (Released May 14, 2024)
--------------

- use neue-haas-grotesk font (#889)
- Shanbady/add subscribe button to pages (#878)
- bump course-search-utils (#900)
- Replace react-dotdotdot with CSS (#896)
- Switch django migrations to release phase (#898)
- Do not show unpublished runs in learning resource serializer data (#894)
- Fix some n+1 query warnings (#884)

Version 0.9.11 (Released May 13, 2024)
--------------

- add format facet (#888)
- Free everything (#885)
- Add nesting learning resource topics (#844)

Version 0.9.10 (Released May 09, 2024)
--------------

- search dropdown (#875)
- Add certificate as a real database field to LearningResource (#862)
- allow Button to hold a ref (#883)
- Display loading view for search page (#881)

Version 0.9.9 (Released May 09, 2024)
-------------

- fix spacing between department groups (#880)
- #4053 Alert UI component (#861)

Version 0.9.8 (Released May 08, 2024)
-------------

- Departments Listing Page (#865)
- only show clear all if it would do something (#877)
- create exported components bundle (#867)
- Update Yarn to v4.2.1 (#872)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.21 (#871)
- Update dependency ruff to v0.4.3 (#870)
- Update codecov/codecov-action action to v4.3.1 (#869)

Version 0.9.7 (Released May 06, 2024)
-------------

- Api sort fixes (#846)
- configure api BASE_PATH (#863)

Version 0.9.6 (Released May 03, 2024)
-------------

- Additional routes to the Django app (#858)
- allow configuring Axios defaults.withCredentials (#854)
- Alert handler for percolate matches (#842)
- Adds the missing OIDC auth route (#855)
- Learning format filter for search/db api's (#845)
- Corrects the path to write hash.txt (#850)
- Lock file maintenance (#578)
- Self contained front end and fixes for building on Heroku (#829)
- remove pytz (#830)
- Update dependency dj-database-url to v2 (#839)
- Update dependency cryptography to v42 (#838)
- Add format field to LearningResource model and ETL pipelines (#828)

Version 0.9.5 (Released April 30, 2024)
-------------

- Minor updates for PostHog settings (#833)
- Update nginx Docker tag to v1.26.0 (#836)
- Update dependency @types/react to v18.3.1 (#835)
- Update dependency ruff to v0.4.2 (#834)
- Don't initialize PostHog if it's disabled (#831)

Version 0.9.4 (Released April 30, 2024)
-------------

- Text Input + Select components (#827)
- Update ckeditor monorepo to v41 (major) (#795)
- Do not analyze webpack by default (#785)
- Populate prices for mitxonline programs (#817)
- Filter for free resources (#810)
- Add drop down for certification in channel search (#802)
- Pin dependencies (#735)
- Update dependency @dnd-kit/sortable to v8 (#796)
- Design system buttons (#800)
- Reverts decoupled front end and subsequent commits to fix Heroku build errors (#825)
- Remove package manager config (#823)
- Set engines to instruct Heroku to install yarn (#821)
- Deployment fixes for static frontend on Heroku (#819)
- fixing compose mount (#818)
- Move hash.txt location to frontend build directory (#815)
- Build front end to make available on Heroku (#813)
- Updating the LearningResourceViewEvent to cascade delete, rather than do nothing, so things can be deleted (#812)
- Self contained front end using Webpack to build HTML and Webpack Dev Server to serve (#678)
- create api routes for user subscribe/unsubscribe to search (#782)
- Retrieve OL events via API instead of HTML scraping (#786)

Version 0.9.3 (Released April 23, 2024)
-------------

- Fix index schema (#807)
- Merge the lrd_view migration and the schools migration (#804)
- School model and api (#788)
- Adds ETL to pull PostHog view events into the database; adds popular resource APIs (#789)
- Update dependency @typescript-eslint/eslint-plugin to v7 (#801)
- Update opensearchproject/opensearch Docker tag to v2.13.0 (#794)
- Update mcr.microsoft.com/playwright Docker tag to v1.43.1 (#793)
- Update dependency ruff to v0.4.1 (#792)
- Update nginx Docker tag to v1.25.5 (#791)
- Update dependency @types/react to v18.2.79 (#790)
- Capture page views with more information (#746)

Version 0.9.2 (Released April 22, 2024)
-------------

- adding manual migration to fix foreign key type (#752)
- Add channel url to topic, department, and offeror serializers (#778)
- Filter channels api by channel_type (#779)

Version 0.9.1 (Released April 18, 2024)
-------------

- Homepage hero section (#754)
- Add necessary celery client configurables for celery monitoring (#780)

Version 0.9.0 (Released April 16, 2024)
-------------

- Customize channel page facets by channel type (#756)
- Update dependency sentry-sdk to v1.45.0 (#775)
- Update dependency posthog-js to v1.121.2 (#774)
- Update dependency ipython to v8.23.0 (#773)
- Update dependency google-api-python-client to v2.125.0 (#772)
- Update all non-major dev-dependencies (#768)
- Update dependency @testing-library/react to v14.3.1 (#771)
- Update dependency @sentry/react to v7.110.0 (#770)
- Update codecov/codecov-action action to v4.3.0 (#769)
- Update material-ui monorepo (#767)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.20 (#765)
- Update dependency uwsgi to v2.0.25 (#766)
- Update dependency ruff to v0.3.7 (#763)
- Update dependency qs to v6.12.1 (#762)
- Update dependency drf-spectacular to v0.27.2 (#761)
- Update dependency boto3 to v1.34.84 (#760)
- Update Node.js to v20.12.2 (#759)
- Pin dependency @types/react to 18.2.73 (#758)
- Add a channel for every topic, department, offeror (#749)
- Update dependency djangorestframework to v3.15.1 (#628)
- Shanbady/define percolate index schema (#737)

Version 0.8.0 (Released April 11, 2024)
-------------

- Channel Search (#740)
- fixing readonly exception in migration (#741)
- fix channel configuration (#743)
- Configurable, Tabbed Carousels (#731)
- add userlist bookmark button and add to user list modal (#732)
- Adds Posthog support to the frontend. (#693)
- Channel types (#725)
- Remove dupe line from urls.py file (#730)
- adding initial models for user subscription (#723)
- Shanbady/add record hash field for hightouch sync (#717)
- fix flaky test (#720)
- Revert "bump to 2024.3.22" (#719)
- add UserList modals and wire up buttons (#718)
- bump to 2024.3.22
- Migrate config renovate.json (#713)
- try ckeditor grouping again (#711)

Version 0.7.0 (Released April 01, 2024)
-------------

- Basic learning resources drawer (#686)
- Update actions/configure-pages action to v5 (#706)
- display image and description in userlists (#695)
- Update dependency sentry-sdk to v1.44.0 (#705)
- Update dependency google-api-python-client to v2.124.0 (#704)
- Update dependency @sentry/react to v7.109.0 (#703)
- Update Node.js to v20.12.0 (#702)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.19 (#701)
- Update dependency safety to v2.3.5 (#700)
- Update dependency nh3 to v0.2.17 (#699)
- Update dependency boto3 to v1.34.74 (#698)
- Update all non-major dev-dependencies (#696)
- Update dependency @emotion/styled to v11.11.5 (#697)
- Add botocore to ignored deprecation warnings, remove old python 3.7 ignore line (#692)
- Add UserListDetails page (#691)
- Add Posthog integration to backend (#682)
- Update postgres Docker tag to v12.18 (#670)
- remove depricated ACL setting (#690)
- fix new upcoming (#684)
- Remove Cloudfront references (#689)
- updating spec (#688)
- Shanbady/endpoint to retrieve session data (#647)
- Sloan Executive Education blog ETL (#679)

Version 0.6.1 (Released April 01, 2024)
-------------

- Search page cleanup (#675)
- Shanbady/retrieve environment config (#653)
- Update codecov/codecov-action action to v4 (#671)
- Add userlists page and refactor LearningResourceCardTemplate (#650)
- fields pages (#633)
- [pre-commit.ci] pre-commit autoupdate (#677)
- fix learningpath invalidation (#635)

Version 0.6.0 (Released March 26, 2024)
-------------

- News & Events API (#638)
- Update opensearchproject/opensearch Docker tag to v2.12.0 (#669)
- Update mcr.microsoft.com/playwright Docker tag to v1.42.1 (#667)
- Update dependency yup to v1.4.0 (#666)
- Update dependency type-fest to v4.14.0 (#668)
- Update dependency sentry-sdk to v1.43.0 (#665)
- Update dependency rc-tooltip to v6.2.0 (#664)
- Update dependency qs to v6.12.0 (#663)
- Update dependency pytest-mock to v3.14.0 (#662)
- Update dependency google-api-python-client to v2.123.0 (#661)
- Update dependency @sentry/react to v7.108.0 (#660)
- Update material-ui monorepo (#659)
- Update dependency ruff to v0.3.4 (#657)
- Update dependency boto3 to v1.34.69 (#656)
- Update all non-major dev-dependencies (#654)
- generate v0 apis (#651)
- MIT news/events ETL  (#612)
- Remove all usages of pytz (#646)
- allow filtering by readable id in the api (#639)
- Update jest-dom, make TS aware (#637)
- fixing ordering of response data in test (#634)
- [pre-commit.ci] pre-commit autoupdate (#610)
- Update dependency eslint-plugin-testing-library to v6 (#354)
- Update Yarn to v3.8.1 (#455)

Version 0.5.1 (Released March 19, 2024)
-------------

- Add a Search Page (#618)
- pushing fix for test failure (#631)
- shanbady/separate database router and schema for program certificates (#617)
- Update dependency django-anymail to v10.3 (#627)
- Update dependency @sentry/react to v7.107.0 (#626)
- Update react-router monorepo to v6.22.3 (#625)
- Update material-ui monorepo (#624)
- Update dependency boto3 to v1.34.64 (#623)
- Update dependency axios to v1.6.8 (#622)
- Update dependency @ckeditor/ckeditor5-dev-utils to v39.6.3 (#621)
- Update dependency @ckeditor/ckeditor5-dev-translations to v39.6.3 (#620)
- Update all non-major dev-dependencies (#619)
- Endpoint for user program certificate info and program letter links (#608)
- Update Node.js to v20 (#507)
- Program Letter View (#605)

Version 0.5.0 (Released March 13, 2024)
-------------

- Avoid duplicate courses (#603)
- Type-specific api endpoints for videos and video playlists (#595)
- Update dependency ipython to v8.22.2 (#600)
- Update dependency html-entities to v2.5.2 (#599)
- Update dependency boto3 to v1.34.59 (#598)
- Update dependency Django to v4.2.11 (#597)
- Update all non-major dev-dependencies (#596)
- Assign topics to videos and playlists (#584)
- Add daily micromasters ETL task to celerybeat schedule (#585)

Version 0.4.1 (Released March 08, 2024)
-------------

- resource_type changes (#583)
- Update nginx Docker tag to v1.25.4 (#544)
- Youtube video ETL and search (#558)

Version 0.4.0 (Released March 06, 2024)
-------------

- Update dependency ruff to ^0.3.0 (#577)
- Update dependency html-entities to v2.5.0 (#576)
- Update dependency python-rapidjson to v1.16 (#575)
- Update dependency python-dateutil to v2.9.0 (#574)
- Update dependency google-api-python-client to v2.120.0 (#573)
- Update dependency @sentry/react to v7.104.0 (#572)
- Update react-router monorepo to v6.22.2 (#571)
- Update dependency storybook-addon-react-router-v6 to v2.0.11 (#570)
- Update dependency sentry-sdk to v1.40.6 (#569)
- Update dependency markdown2 to v2.4.13 (#568)
- Update dependency ddt to v1.7.2 (#567)
- Update dependency boto3 to v1.34.54 (#566)
- Update dependency @ckeditor/ckeditor5-dev-utils to v39.6.2 (#565)
- Update dependency @ckeditor/ckeditor5-dev-translations to v39.6.2 (#564)
- Update all non-major dev-dependencies (#563)
- Create program certificate django model (#561)
- fix OpenAPI response for content_file_search (#559)
- Update material-ui monorepo (#233)
- next/previous links for search api (#550)
- Remove livestream app (#549)
- Assign best date available to LearningResourceRun.start_date field (#514)
- Update dependency ipython to v8.22.1 (#547)
- Update dependency google-api-python-client to v2.119.0 (#546)
- Update dependency @sentry/react to v7.102.1 (#545)
- Update mcr.microsoft.com/playwright Docker tag to v1.41.2 (#543)
- Update dependency sentry-sdk to v1.40.5 (#542)
- Update dependency iso-639-1 to v3.1.2 (#540)
- Update dependency boto3 to v1.34.49 (#541)
- Update all non-major dev-dependencies (#539)

Version 0.3.3 (Released March 04, 2024)
-------------

- Save user with is_active from SCIM request (#535)
- Add SCIM client (#513)
- CI and test fixtures for E2E testing (#481)
- Update postgres Docker tag to v12.18 (#530)
- Update dependency responses to ^0.25.0 (#529)
- Update dependency google-api-python-client to v2.118.0 (#528)
- Update dependency @sentry/react to v7.101.1 (#527)
- Update react-router monorepo to v6.22.1 (#526)
- Update nginx Docker tag to v1.25.4 (#524)
- Update dependency ruff to v0.2.2 (#525)
- Update dependency social-auth-core to v4.5.3 (#523)
- Update dependency sentry-sdk to v1.40.4 (#522)
- Update dependency iso-639-1 to v3.1.1 (#521)
- Update dependency boto3 to v1.34.44 (#520)
- Update all non-major dev-dependencies (#519)
- Update Node.js to v18.19.1 (#518)

Version 0.3.2 (Released February 20, 2024)
-------------

- Update ruff and adjust code to new criteria (#511)
- Avoid using get_or_create for LearningResourceImage object that has no unique constraint (#510)
- Update SimenB/github-actions-cpu-cores action to v2 (#508)
- Update dependency sentry-sdk to v1.40.3 (#506)
- Update dependency react-share to v5.1.0 (#504)
- Update dependency pytest-django to v4.8.0 (#503)
- Update dependency google-api-python-client to v2.117.0 (#502)
- Update dependency faker to v22.7.0 (#501)
- Update dependency @sentry/react to v7.100.1 (#499)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.18 (#498)
- Update dependency uwsgi to v2.0.24 (#497)
- Update all non-major dev-dependencies (#500)
- Update dependency boto3 to v1.34.39 (#496)
- Update dependency Django to v4.2.10 (#495)
- Update dependency @ckeditor/ckeditor5-dev-utils to v39.6.1 (#493)
- Update dependency @ckeditor/ckeditor5-dev-translations to v39.6.1 (#492)
- Update all non-major dev-dependencies (#491)
- fix topics schema (#488)
- Use root document counts to avoid overcounting in aggregations (#484)

Version 0.3.1 (Released February 14, 2024)
-------------

- Avoid integrity errors when loading instructors (#478)
- Load fixtures by default in dev environment (#483)
- upgrading version of poetry (#480)
- Fix multiword search filters & aggregations, change Non Credit to Non-Credit
- Update dependency nplusone to v1 (#381)
- Update dependency pytest-env to v1 (#382)

Version 0.3.0 (Released February 09, 2024)
-------------

- Allow for blank OCW terms/years (adjust readable_id accordingly), raise an error at end of ocw_courses_etl function if any exceptions occurred during processing (#475)
- Remove all references to open-discussions (#472)
- Fix prolearn etl (#471)
- Multiple filter options for learningresources and contenfiles API rest endpoints (#449)
- Lock file maintenance (#470)
- Update dependency pluggy to v1.4.0 (#468)
- Update dependency jekyll-feed to v0.17.0 (#467)
- Update dependency @types/react to v18.2.53 (#469)
- Update dependency ipython to v8.21.0 (#466)
- Update dependency google-api-python-client to v2.116.0 (#465)
- Update dependency django-debug-toolbar to v4.3.0 (#464)
- Update dependency @sentry/react to v7.99.0 (#463)
- Update apache/tika Docker tag to v2.5.0 (#461)
- Update docker.elastic.co/elasticsearch/elasticsearch Docker tag to v7.17.17 (#460)
- Update dependency prettier to v3.2.5 (#462)
- Update dependency social-auth-core to v4.5.2 (#458)
- Update dependency toolz to v0.12.1 (#459)
- Update dependency moto to v4.2.14 (#457)
- Update dependency drf-spectacular to v0.27.1 (#456)
- Update dependency boto3 to v1.34.34 (#454)
- Update dependency beautifulsoup4 to v4.12.3 (#453)
- Update dependency axios to v1.6.7 (#452)
- Update codecov/codecov-action action to v3.1.6 (#451)
- Update all non-major dev-dependencies (#450)
- Added support to set SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS (#429)
- do not allow None in levels/languages (#446)

Version 0.2.2 (Released February 02, 2024)
-------------

- Fix webhook url (#442)
- Update akhileshns/heroku-deploy digest to 581dd28 (#366)
- Poetry install to virtualenv (#436)
- rename oasdiff workflow (#437)
- Upgrade tika and disable OCR via headers (#430)
- Add a placeholder dashboard page (#428)
- Update dependency faker to v22 (#378)
- Update dependency jest-fail-on-console to v3 (#380)
- Save OCW contentfiles as absolute instead of relative (#424)
- Check for breaking openapi changes on ci (#425)
- Initial E2E test setup with Playwright (#419)
- Use DRF NamespaceVersioning to manage OpenAPI api versions (#411)

Version 0.2.1 (Released January 30, 2024)
-------------

- Modify OCW webhook endpoint to handle multiple courses (#412)
- Optionally skip loading OCW content files (#413)
- Add /api/v0/users/me API (#415)

Version 0.2.0 (Released January 26, 2024)
-------------

- Get rid of tika verify warning (#410)
- Improve contentfile api query performance (#409)
- Search: Tweak aggregations formattings, add OpenAPI schema for metadata (#407)
- Remove unused django apps (#398)

Version 0.1.1 (Released January 19, 2024)
-------------

- Replace Sass styles with Emotion's CSS-in-JS (#390)
- move openapi spec to subdir (#397)
- Add Storybook to present front end components (#360)
- remove legacy search (#365)
- Remove author from LearningPath serializer (#385)

Version 0.1.0 (Released January 09, 2024)
-------------

- chore(deps): update dependency github-pages to v228 (#379)
