# Book Club: FreeCodeCamp Project 
Fullstack Javascript Book Club App

See the app running [here](https://fcc-book-club.herokuapp.com/).

## Overview

 Book Club is a fullstack JavaScript implementation of a book sharing website utilizing PostgreSQL, Express, Node.js and the Google Books and Facebook APIs. The app is deployed with NGINX on Heroku.
 Fufilling the FreeCodeCamp project requirements:

* Users can view all books posted by every user.
* After logging in, users can add their own books to the club.
* Users can update their profiles with their name, city and state.
* Users can propose trades to other users and wait for a response (accept, reject).

## Quick Start Guide

### Prerequisites

In order to use Pinclone, you must have the following installed:

- [Node.js](https://nodejs.org/)
- [NPM](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)(optional)
- [PGAdmin](https://www.pgadmin.org/) (optional)

### Installation & Startup

**Clone GitHub Repo**

```bash
$ git clone https://github.com/CLClark/fcc-book-club.git your-project
```

This will install the Pinclone components into the `your-project` directory.

### Heroku Setup

To enable NGINX to act as proxy server on your Heroku dyno,
add the following Buildpack: 
https://github.com/CLClark/heroku-buildpack-nginx.git

Also, you will need to set the following environmental variables in your Heroku dyno with:

```
heroku config:set KEY=VALUE
```
* ZOO_COOKIE_SECRET (create a server-side secret hash for session management)
* FACEBOOK_KEY (from your Facebook app credentials)
* FACEBOOK_SECRET(from your Facebook app credentials)
* API_KEY(from your Facebook app credentials)
* APP_URL (ex: https://my-heroku-dyno.herokuapp.com)
* ```PGSSLMODE=require```
* DATABASE_URL (your PostgreSQL single line access URL; includes username, password, database url, etc.)
* LOCAL = ('true' if you are running on localhost instead of heroku, otherwise: false )
* PORT (if running locally; ex: '8080')

If you are running this app locally instead of Heroku, save these variables to your server's .env file.

### Facebook Setup
coming...

### PostgreSQL Setup

Use the SQL statements within [postgres-sql.sql](postgres-sql.sql), substituting your own username to create the required tables:
* books
* ownership
* users
* session
* trades

and trigger functions:
* tradesCancel
* tsv_trigger

Book Club also requires the [pgcrypto](https://www.postgresql.org/docs/current/static/pgcrypto.html) PostgreSQL module, be sure to install or add it to your PostgreSQL instance.

### Contributing

This is an open-source project to fufill FreeCodeCamp project requirements, contributions are welcome, simply send me a note on Github.

### Tutorial

You can find a complete step-by-step tutorial on how to create this app from the ground up [here]().

## Authors

* **Chris L Clark ** - *Initial work* - [CLClark](https://github.com/CLClark/)

## License

Apache License 2.0. [Click here for more information.](LICENSE.md)
