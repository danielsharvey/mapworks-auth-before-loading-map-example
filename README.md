# Mapworks Auth Example - User Sign In before loading map

This example illustrates utilising Mapworks Auth with a web application.

The specfic use case includes accessing auth via Mapworks, and allowing sign-in prior to the use of a Mapworks map component.


## Running in CodeSandbox

This example may be run in CodeSandbox:

- https://githubbox.com/mapworksio/mapworks-auth-before-loading-map-example


## Running locally

For a local DEV server:

```sh
npm run start
```

Navigate to `http://localhost:1234`. The application will automatically reload if you change any of the source files.

When utilising this example locally, or in your own web application, the following needs to be updated (in [src/index](src/index.ts)) for your Mapworks Organisation, Mapworks Application and web application URL:

```ts
const mapworksOrgUrl = 'https://app.mapworks.io';
const client_id = '3mvor82v8k8f6nbi4f8bpihsom';
const mapRef = 'map-osm-public';
```

## Build

Build the project as follows:

```sh
npm run build
```

The build artifacts will be stored in the `dist/` directory.


## Using the code

The [src/mapworks](src/mapworks) and [public](public) subfolders may be copied and used directly in web application code.

- [src/mapworks](src/mapworks) - this contains the `MapworksMapService` class used to manage auth and map initialisation.
- [public](public) - this handles the OAuth2/OIDC callback used as part of the sign in process


## Other Examples

Please also see the following related examples:


