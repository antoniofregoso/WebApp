# WebAppp

WebApp is a template for generating web applications within the conceptual framework of systems theory. This means that the app is a tool for controlling and managing a system or part of a system.

The data is sent in a JSON object, which is a [Single Source of Truth](./DATA_FORMAT.md), containing all the information needed to view and modify the objects.

Each type of object in the system has its own view where you can see all its instances with their state, variables, and location in time. Two visualization modes are available:

1. [Object Views](./VIEWS_FORMAT.md).
2. [Insights](./INSIGHTS_FORMAT.md).

## Backend queries

Web App uses GraphQL as its query tool.
The available queries are [here](./GRAPHQL_QUERIES.md).

[Quick Start Guide - Backend](./BACKEND.md).

[Database setup](./DATABASE_SETUP.md).
