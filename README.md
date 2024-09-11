# Introduction

This repo is meant as an experiment to explore and demonstrate the idea of implementing end-to-end testing with Playwright while coordinating the resetting of state with the back end of an application before each test. In the repo is a simple full stack web todo list application with associated end-to-end tests.

# Getting Started

## Install Dependencies

First of all, please note that the project has only been tested in macOS.

To run the tests or the application in development, the app requires several dependencies:

- .NET 8 SDK (https://dotnet.microsoft.com/en-us/download)
- Node.js - the project has been tested with version 22, but other versions may also work (https://nodejs.org/)
- PostgreSQL - the project has been tested with version 14, but other versions may also work (https://www.postgresql.org/download/)
- Docker Desktop (https://www.docker.com/products/docker-desktop/)

Please ensure all of the dependencies are installed before proceeding.

## Initial Configuration Steps

The following instructions should be followed in the order in which they are written. The instructions may not work if they are followed out of order.

### Setting Up Database Objects

#### Create a Role

After an instance of PostgreSQL is up and running, one needs to decide on a role to be used for accessing the databases for the application. The role (or multiple roles, if one prefers) can be the root `postgres` role or a separate role (recommended). The role will need the permission to log in to the instance (`LOGIN`) and the permission to drop and create databases on the instance (`CREATEDB`). The following statement creates a role named `todouser` with the `CREATEDB` and `LOGIN` permissions and the password `password`. Unless you have different role that you prefer to use, run the following statement using `psql` (or the PostgreSQL client or your choice) and the `postgres` role (or another role of your choice that has permission to create a role).

```postgresql
CREATE ROLE todouser WITH CREATEDB LOGIN PASSWORD 'password';
```

#### Create the Development Database

After you have decided on the role to use and have created it (if necessary), the next step is to create the database that will be used by the application for the purpose of development. Create a database that is owned by the role you designated. The following statement creates a database called `todo` that will be owned by the role `todouser`. Run the following statement, adjusting the names of the database and owner as you prefer.

```postgresql
CREATE DATABASE todo OWNER todouser;
```

#### Test Database will be Created Dynamically

The program in the `SeedDatabase` project will drop and recreate a test database on every run. This database is separate from the development database created earlier. While there is no need to manually create or delete the test database, one does need to configure the name and connection string for it. Instructions for doing so will appear later.

### API Service Project

#### User Secrets

In order to connect to the development database, the API service needs to know the role, password, name, and PostgreSQL instance associated with it. One can provide this information via a connection string. During startup, the API service looks for the connection string in a variable named `DB_CONN_STR`, looking first in the process's environment variables for a variable of that name and then looking in Secret Manager's storage (if present).

The following shell commands demonstrate how one can set up Secret Manager for the API service's .Net project and store the connection string in the Secret Manager's storage. The commands assume that the working directory of the shell starts at the root directory of the repo.

```shell
cd ./api/TodoRwa
dotnet user-secrets init
dotnet user-secrets set DB_CONN_STR "Host=localhost;Username=todouser;Password=password;Database=todo"
```

In the command, the hostname of the PostgreSQL instance is `localhost`, the port of instance is 5432 (implied, so not explicitly specified), the role is `todouser`, the password is `password`, and the database name is `todo`. Be sure to make adjustments to the connection string as needed if you configuration differs from the defaults in the earlier steps.

#### Apply Migration

After specifying the connection string, one can now use Entity Framework Core tools to create the tables associated with the schema defined in the API service project. To do so, first, install the Entity Framework Core tools if they are not installed already (https://learn.microsoft.com/en-us/ef/core/cli/dotnet#installing-the-tools). Then, use the below command to apply the migrations. Be sure to run the command from the API service's project folder (`./api/TodoRwa` relative to the root of the repo).

```shell
dotnet ef database update
```

### Seed Database Script Project

#### User Secrets

Similar to the API service project, one needs to specify a connection string for the project containing the seed database script. Unlike the API service project, the seed database project requires three separate values, the connection string for the development database, and the connection string for the test database, and the name of the test database. Run the shell commands below to set up the variables containing these values.

```shell
cd ./api/SeedDatabase
dotnet user-secrets init
dotnet user-secrets set TEST_DB_NAME todotest
dotnet user-secrets set TEST_DB_CONN_STR "Host=localhost;Username=todouser;Password=password;Database=todotest"
dotnet user-secrets set MAIN_DB_CONN_STR "Host=localhost;Username=todouser;Password=password;Database=todo"
```

Like for the API service project, be sure to adjust the values for hostname, role name, password, and database name in the connection strings if your setup differs from the defaults in the earlier instructions for setting up the database.

### Web Client App

#### User Secrets

While running end-to-end tests with Playwright, the web client app starts and stops the API service before each test. Unlike when running the API service for development purposes, the test runner needs to override the connection string for the API service to point to the test database instead. The test runner can perform this override by providing a user-supplied connection string for the environment variable named `DB_CONN_STR` in the process that starts the API service.

One can supply the connection string to the test runner by exporting an environment variable to the shell when calling the Playwright CLI to run the tests. In the below example, the shell command first exports a connection string as the value for the test database to the variable `DB_CONN_STR` and the executes the script `test` in `package.json` to have the Playwright CLI run the test suite. The command assumes that the initial working directory is the root of the repo. Note that the command will likely not work until you've installed dependencies for the client app project by running `npm install`.

```shell
cd ./client
export DB_CONN_STR="Host=localhost;Username=todouser;Password=password;Database=todotest"; npm run test
```

Like with the other User Secrets instructions sections, be sure to adjust the values in the connection string if they differ from the defaults given in the Getting Started > Initial Configuration > Database sections of this document.

Instead of manually specifying the DB_CONN_STR environment variable every time you want to run tests, consider storing the variable's value inside an IDE's run configuration. As always, if the connection string contains sensitive credentials, such as credentials to connect to cloud-hosted database, before to exclude the relevant configuration settings from version control.

## Running the App for Development Purposes

### Start API Service

To run the API Service project for development purposes, execute the default `http` profile from the `./api/TodoRwa` subdirectory with:

```shell
dotnet run
```

Alternatively, one can run the npm script `start-api` from the `./client` subdirectory.

```shell
npm run start-api
```

With either method, unless one explicitly specifies a connection string in the environment variable `DB_CONN_STR`, the API service will connect to the development database after it starts (provided that one followed the setup instructions in the Setting Up Database Object section earlier).

### Start Web Client Development Server

First, install npm package dependencies in the web client app (from the `./client` subdirectory) if you haven't already.

```shell
npm install
```

Next, start the Next.js development server for the web client app with the `dev` npm script.

```shell
npm run dev
```

Then, start a browser and navigate to the http://localhost:3000, either manually or by clicking on the link in the npm script's output. From the browser, you can use the UI to create, read, update, or delete todo list items.

### Starting the API Service and Web Client Dev Server Concurrently

Start both the web client dev server and API service concurrently using the `dev-full` npm script. Terminating the process (gracefully, with ctrl + c or SIGTERM) should gracefully terminate both the web client dev server and api service.

```shell
npm run dev-full
```

## Running End-to-end Tests

As mentioned previously in the Getting Started > Initial Configuration Steps > Web Client App > User Secrets section, to execute end-to-end tests, run the `test` npm script from the `./client` subdirectory while supplying the connection string to the test database as an environment variable.

```shell
export DB_CONN_STR="Host=localhost;Username=todouser;Password=password;Database=todotest"; npm run test
```

To run the test's with Playwright's UI, instead use the following command.

```shell
export DB_CONN_STR="Host=localhost;Username=todouser;Password=password;Database=todotest"; npm run test-ui
```

Note that Docker Desktop must be running for the tests to succeed.

# Future Improvements

There is vast potential for improvements to this project. Just a few of the most obvious ideas that came to mind include:

- Moving the seed data to a central location and have both the API service and web client code bases read from that central location
- Parallelizing tests across multiple databases and instances of the API service
- Adding authentication via a service and working through the challenges posed by testing with such services
- Certain behaviors of the UI, such as the indications that a change is pending upon adding, updating, or deleting an item, are time-sensitive and not very suitable for testing via Playwright. To cover these behaviors with tests, one can consider adding unit tests for the component in question with React Testing Library.