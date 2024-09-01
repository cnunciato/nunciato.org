# nunciato.org

The monorepo that ships my website and other things. :rocket:

## Handy commands

### Install all project dependencies

```bash
npm install && npm install --workspaces
```

### Run dev servers

```bash
npm run dev
```

### Build all the things

```bash
npm run build
```

### Deploy to dev environments

```bash
npm run deploy:dev --workspace chris.infra
```

### Tear down dev environments

```bash
npm run destroy:dev --workspace chris.infra
```
