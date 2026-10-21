# Project structure

The backend and frontend keep shared registry metadata for navigation,
permissions, and request validation, while each business entity has its own
schema, controller, routes, and frontend page. Keep those files synchronized
when adding or changing a registry-backed entity.

## Backend

| Location | Responsibility |
| --- | --- |
| `Backend/src/server.js`, `app.js` | Process startup and Express application composition |
| `Backend/src/config/` | Database connection configuration |
| `Backend/src/registry/modules/` | Business modules and their entity/submodule field definitions |
| `Backend/src/registry/fields.js` | Field types, schema conversion, and client field metadata |
| `Backend/src/models/` | Hand-written models and complete per-entity Mongoose schemas |
| `Backend/src/controllers/` | Per-entity CRUD handlers and custom access controllers |
| `Backend/src/routes/` | Per-entity route definitions, custom feature routers, and API composition |
| `Backend/src/services/` | Authentication, permissions, reporting, analytics, and transliteration logic |
| `Backend/src/middlewares/` | Authentication, authorization, auditing, and error handling |
| `Backend/src/validators/` | Validation of entity payloads against registry field definitions |
| `Backend/src/utils/` | Shared response, error, and async helpers |
| `Backend/src/seed/` | Seed and data-backfill scripts |

Registry-backed CRUD URLs follow `/api/<module>/<submodule>`. Each entity has a
complete Mongoose schema in `models/entities/`, direct CRUD handlers in
`controllers/entities/`, and an explicit router in `routes/entities/`. The
models and handlers no longer call generic model/controller/router factories.
Field metadata remains in `registry/modules/` for navigation and backend
validation. Entity pages carry their own corresponding frontend field lists.
User and role access-control operations use their
hand-written models and custom `userController.js`/`roleController.js` logic;
their routes, permission catalog, and activity logs are separated into
individual route/controller files.

To change an entity's fields, update its Mongoose schema under
`Backend/src/models/entities/`, its metadata `sub(...)` definition in
`Backend/src/registry/modules/`, and the matching page's `fields` declaration
under `Frontend/src/pages/entities/`. The registry drives backend validation
and navigation; the schema defines persisted fields; and the page declaration
defines its form labels and inputs.

## Frontend

| Location | Responsibility |
| --- | --- |
| `Frontend/src/App.jsx` | Authenticated route table and custom-page overrides |
| `Frontend/src/pages/` | Dashboard, login, one discoverable page entry per registry entity, and reports |
| `Frontend/src/pages/entities/<module>/<Entity>Page.jsx` | Full entity-specific list, form, and CRUD page with its own field definitions |
| `Frontend/src/components/forms/EntityFieldInput.jsx` | Reusable low-level field input control |
| `Frontend/src/pages/modules/UsersPage.jsx`, `RolesPage.jsx` | Custom user and role screens |
| `Frontend/src/pages/modules/ActivityLogPage.jsx`, `PermissionCatalogPage.jsx` | Custom access-control report screens |
| `Frontend/src/pages/reports/ReportPage.jsx` | Generic report screen |
| `Frontend/src/components/` | Reusable UI components |
| `Frontend/src/components/dashboard/` | Dashboard overview, metrics, and animated journey widgets |
| `Frontend/src/layouts/` | Authenticated application shell and sidebar |
| `Frontend/src/api/` | Shared HTTP client and feature-specific API wrappers |
| `Frontend/src/context/` | Authentication, permissions, and navigation state |
| `Frontend/src/hooks/` | Reusable dashboard animation and clock hooks |
| `Frontend/src/config/` | Frontend API configuration |
| `Frontend/src/lib/` | Shared application libraries, including transliteration |
| `Frontend/src/utils/` | Shared date, number, and registry-label formatting |
| `Frontend/src/styles/` | Global Tailwind styles and dashboard animation styles |
| `Frontend/public/` | Static public assets |

The route table is generated from the authenticated navigation tree. The
custom-page overrides in `App.jsx` map `access/user` and `access/role` to their
specialized screens, and `access/permission` and `access/activityLog` to their
specialized reports. Every other entity has a complete page implementation under
`Frontend/src/pages/entities/` (for example,
`cane/FarmerPage.jsx` and `organization/FactoryRegistrationPage.jsx`). These
pages define their entity fields and CRUD behavior directly while sharing only
low-level input and display primitives. Other report pages use `ReportPage`.

Farmer model fields are in `Backend/src/models/entities/Farmer.js`; its backend
validation metadata is the `farmer` definition in
`Backend/src/registry/modules/operations.js`, and its form fields are in
`Frontend/src/pages/entities/cane/FarmerPage.jsx`. For factory registration,
see `Backend/src/models/entities/FactoryRegistration.js`,
`Backend/src/registry/modules/core.js`, and
`Frontend/src/pages/entities/organization/FactoryRegistrationPage.jsx`.

There is no separate frontend `services/` module at present: feature-specific
HTTP wrappers live in `api/`. Public static assets stay in `Frontend/public/`;
there are no imported asset modules to relocate.
