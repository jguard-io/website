# jGuard Website

The official documentation website for [jGuard](https://github.com/jguard-io/jguard), built with [Docusaurus](https://docusaurus.io/).

## Development

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

This starts a local development server at http://localhost:3000. Most changes are reflected live without restarting.

### Build

```bash
npm run build
```

Generates static content into the `build` directory.

### Preview Build

```bash
npm run serve
```

Serves the built website locally.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

## Custom Domain

The site is configured to use the `jguard.io` domain. To set up:

1. In your DNS provider, add a CNAME record pointing to `jguard-io.github.io`
2. Add `jguard.io` to the GitHub Pages settings for this repository

## Contributing

See the main [jGuard contributing guide](https://github.com/jguard-io/jguard/blob/main/CONTRIBUTING.md).

## License

Apache License 2.0
