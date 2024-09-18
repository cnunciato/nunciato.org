# nunciato.org

[![Build status](https://badge.buildkite.com/e337f5834da60ebf4cfe886f70b46c78bfcc69a28749d5c6b7.svg)](https://buildkite.com/nunciato/pipeline)

The monorepo I use to manage [my website](https://chris.nunciato.org) and other things. :rocket:

## Handy commands

```bash
# Install project dependencies
npm install && npm install --workspaces

# Run dev servers
npm run dev

# Build all the things
npm run build

# Deploy to the dev environments
npm run deploy:dev --workspace infra.chris

# Tear down dev environments
npm run destroy:dev --workspace infra.chris
```

Commits to the `dev` branch trigger deployments to the AWS pre-prod environment (with [Pulumi](https://pulumi.com/docs), naturally). Commits to `main` trigger deployments to production.
