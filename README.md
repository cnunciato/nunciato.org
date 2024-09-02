# nunciato.org

The monorepo I use to manage [my website](https://chris.nunciato.org) and a few other things. :rocket:

## Handy commands

```bash
# Install all project dependencies
npm install && npm install --workspaces

# Run dev servers
npm run dev

# Build all the things
npm run build

# Deploy to dev environments
npm run deploy:dev --workspace chris.infra

# Tear down dev environments
npm run destroy:dev --workspace chris.infra
```
