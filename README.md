# nunciato.org

[![Build status](https://badge.buildkite.com/727d92766892a97881afaca437f57e8ad71683229c5e9f446d.svg)](https://buildkite.com/nunciato/chris-dot-nunciato-dot-org)

The monorepo I use to manage [my website](https://chris.nunciato.org) and other things. :rocket:

## Handy commands

```bash
# Install all project dependencies.
npm install && npm install --workspaces

# Run the dev servers.
npm run dev

# Build all the things.
npm run build

# Deploy to the dev environments.
npm run deploy:dev --workspace infra.chris

# Tear down dev environments.
npm run destroy:dev --workspace infra.chris

# Deploy common infrastructure (e.g., the Buildkite pipeline, etc.).
npm run deploy:production -w infra.common
```

Commits to the `dev` branch trigger deployments to the AWS pre-prod environment (with [Pulumi](https://pulumi.com/docs), naturally). Commits to `main` trigger deployments to production.
