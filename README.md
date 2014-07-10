# CozyHR, Inc.

Welcome to CozyHR. Let's get started.

## Important Sites

Issue Tracking: http://issues.cozyhr.com (ask for invite)

## Requirements

- node
- npm

## Development

You will first want to clone the repo into your local development environment:

    git clone git@github.com:ethryx/cozyhr.git
    
You can then install the dependencies:

    npm install
    
The server can then be ran using the following:

    sails lift
    
The worker app can be ran using:

    node worker/worker.js
    
And you can run unit testing (which should be done before commiting) using:

    npm test

## Workflow

Minor updates can be done directly in the `master` branch, however, these should only span a commit or two and shouldn't break anything if we're pushing to production.

All other updates should be pushed to their own branch. When you're done working on the update, be sure it works locally and then create a pull request.
