- Should not expose db model specific names like \_\_v in the API to avoid giving out clues on what tech is being used. This might help a malicious user.

- Should have added sort by and direction fields to cursor pagination

- Could have added a previous in cursor pagination

- My cache key is sensitive to key order, I could improve this by sorting object keys

- in GET /records "q" is compared against 3 columns with regex. I should have created a text index using multiple document properties and compare against it instead. (https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/create-text-index/)

- MusicBrainz rate limit seems pretty low, should have cached the results to avoid errors, assuming the data is pretty static.

- could have improved coverage but I believe I hit the most important things
