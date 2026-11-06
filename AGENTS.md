# Repository Guidelines

## Project Structure & Module Organization

This directory is currently an empty project scaffold. No source code, tests, assets, dependency manifests, or build configuration are present. Introduce directories only as the implementation requires them; suggested locations are `src/` for application code, `tests/` for automated tests, and `assets/` for static resources. Keep configuration files at the project root and document the resulting layout in `README.md`.

## Build, Test, and Development Commands

No build, test, lint, or local development commands are configured yet. Do not assume commands such as `npm test` or `make build` are available. When selecting a toolchain, add reproducible dependency installation and documented commands for running, building, testing, and linting the project. Record prerequisites and environment setup in `README.md`.

## Coding Style & Naming Conventions

No language, formatter, or linting rules have been established. When introducing code, choose conventions appropriate to the selected language and enforce them through shared configuration. Use descriptive names, consistent indentation, and small modules with clear responsibilities. Follow existing conventions once they are established; avoid unrelated formatting changes.

## Testing Guidelines

No testing framework or coverage threshold is configured. Add automated tests alongside the first implementation and document how to run them. Use descriptive test names that identify behavior and expected outcomes. Cover successful operations, invalid input, and failure paths; keep credentials and external service dependencies out of unit tests.

## Commit & Pull Request Guidelines

No Git repository or commit history is available here, so existing commit conventions cannot be inferred. Use concise, imperative commit subjects, such as `Add token validation`. Keep changes focused. Pull requests should explain the purpose, summarize behavior changes, link relevant issues, and describe validation performed. Include screenshots when changes affect a user interface.

## Security & Configuration

Never commit credentials, access tokens, or private keys. If environment configuration is introduced, provide an example file containing placeholders and exclude local secrets from version control. Avoid logging authentication tokens or other sensitive values.
