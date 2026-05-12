# Record Store Challenge API
## Description

This is a **NestJS** application starter with MongoDB integration. If necessary, it provides a script to boot a Mongo emulator for Docker. This setup includes end-to-end tests, unit tests, test coverage, linting, and database setup with data from `data.json`.

## Installation

### Install dependencies:

```bash
$ npm install
````

### Docker for MongoDB Emulator
To use the MongoDB Emulator, you can start it using Docker:
```
npm run mongo:start
```
This will start a MongoDB instance running on your local machine. You can customize the settings in the Docker setup by modifying the docker-compose-mongo.yml if necessary. In the current configuration, you will have a MongoDB container running, which is accessible at localhost:27017.
This mongo url will be necessary on the .env file, with example as follows:

```
MONGO_URL=mongodb://localhost:27017/records
```
This will point your application to a local MongoDB instance.

### MongoDB Data Setup
The data.json file contains example records to seed your database. The setup script will import the records from this file into MongoDB.

To set up the database with the example records:

```
npm run setup:db
```
This will prompt the user to cleanup (Y/N) existing collection before importing data.json


#### data.json Example
Here’s an example of the data.json file that contains records:
```
[
    {
        "artist": "Foo Fighters",
        "album": "Foo Fighers",
        "price": 8,
        "qty": 10,
        "format": "CD",
        "category": "Rock",
        "mbid": "d6591261-daaa-4bb2-81b6-544e499da727"
  },
  {
        "artist": "The Cure",
        "album": "Disintegration",
        "price": 23,
        "qty": 1,
        "format": "Vinyl",
        "category": "Alternative",
        "mbid": "11af85e2-c272-4c59-a902-47f75141dc97"
  },
]
```

### Running the App
#### Development Mode
To run the application in development mode (with hot reloading):

```
npm run start:dev
```
#### Production Mode
To build and run the app in production mode:

```
npm run start:prod
```

### Tests
#### Run Unit Tests
To run unit tests:

```
npm run test
```
To run unit tests with code coverage:

```
npm run test:cov
```
This will show you how much of your code is covered by the unit tests.
#### Run End-to-End Tests
To run end-to-end tests:
```
npm run test:e2e
```
Run Tests with Coverage


Run Linting
To check if your code passes ESLint checks:

```
npm run lint
```
This command will show you any linting issues with your code.


## Adjustment to exisitng implementation notes

### MBID + MusicBrainz behavior

- `mbid` is optional on create/update requests.
- When provided, it must be a **MusicBrainz release MBID** because the service calls the MusicBrainz release endpoint to fetch tracklist data.
- Error handling is now explicit:
  - Invalid/non-existent release MBID (404) -> `Invalid release MBID`
  - Upstream/network/unavailable cases -> `MusicBrainz unavailable`
- Swagger DTO descriptions were updated to clarify that artist MBIDs are not valid for this field.

### Local MongoDB reliability fix
- The Mongo replica set member host was set to `localhost:27017` for host-machine NestJS runs.
- App config now prefers `.env` values (`dotenv.config({ override: true })`) and includes a local Mongo fallback URL.
- This prevents `ENOTFOUND mongodb` when running the API/tests outside Docker.

### Unique artist + album + format
- Records are unique on `(artist, album, format)` (MongoDB compound index).
- Creating or updating to a combination that already exists will now return **409 Conflict** with a clear message instead of a raw Internal server err **500** duplicate-key error.
- Swagger’s default example (e.g. The Beatles / Abbey Road / Vinyl) will return **409** if that row is already in our database from a previous POST or seed; so that we can use a different album name or delete the existing document to retry.

