Release Notes
=============

Version 0.3.1
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
