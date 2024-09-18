# nunciato.org

Testing.

[![Build status](https://badge.buildkite.com/e5f135f3e93056f0498da9ef82a510ee16835bf7ed79d4e294.svg)](https://buildkite.com/nunciato/nunciato-dot-org)

The monorepo I use to manage [my website](https://chris.nunciato.org) and a few other things. :rocket:

## Handy commands

```bash
# Install all project dependencies
npm install && npm install --workspaces

# Run dev servers
npm the run dev

# Build all the things
npm run build

# Deploy to the dev environments
npm run deploy:dev --workspace chris.infra

# Tear down dev environments
npm run destroy:dev --workspace chris.infra
```

Commits to the `dev` branch trigger deployments to the AWS pre-prod environment (with [Pulumi](https://pulumi.com/docs), naturally). Commits to `main` trigger deployments to production.
