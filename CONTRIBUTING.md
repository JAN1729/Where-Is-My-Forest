# Contributing to Where Is My Forest 🌲

First off, thank you for considering contributing to **Where Is My Forest**! It's people like you who make open-source climate tech a reality. We aim to create a welcoming, collaborative, and highly professional environment.

This document outlines the process for setting up your environment, branching, and submitting pull requests.

## 🛠️ Local Development Setup

Please refer to the [README.md - Local Setup](README.md#🚀-idiot-proof-local-setup) section for detailed instructions on getting the app running locally with Vite and Supabase.

## 🌿 Branch Naming Conventions

To keep our repository clean and organized, please follow these branching conventions:

- `feature/<feature-name>` for new features (e.g., `feature/live-fire-map`)
- `bugfix/<bug-name>` for bug fixes (e.g., `bugfix/mobile-nav-overlap`)
- `chore/<chore-name>` for maintenance tasks or dependency updates (e.g., `chore/update-react`)
- `docs/<doc-name>` for documentation changes (e.g., `docs/api-readme-update`)

*Example:* `git checkout -b feature/add-dark-mode`

## 📝 Commit Message Guidelines

We prefer [Conventional Commits](https://www.conventionalcommits.org/). This helps us auto-generate changelogs and trace the history of the project easily.

**Format:**
```
<type>(<optional scope>): <description>
```

**Types:**
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools and libraries

**Example:**
`feat(map): add NASA FIRMS heat layer integration`

## 🚀 Pull Request Process

1. **Ensure your code works:** Test everything locally. If you've modified `schema.sql`, ensure you've tested it against a fresh Supabase instance.
2. **Linting:** Run `npm run lint` to catch any easy formatting or syntax mistakes.
3. **Commit and Push:** Commit your changes following the message guidelines, and push to your fork.
4. **Open a PR:** Go to the main repository and open a Pull Request.
5. **Fill out the PR Template:** We provide a comprehensive Pull Request template. Please fill it out entirely. Include screenshots if you've made UI changes!
6. **Code Review:** A maintainer will review your PR. Be open to feedback and discussion. We may ask you to make some adjustments.
7. **Merge:** Once approved, your PR will be merged into the `main` branch.

## 🐛 Reporting Bugs

If you find a bug, please use the provided [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) in the Issues tab. 
Provide as much context as possible, including OS, browser, and steps to reproduce.

## 💡 Proposing Features

Have an idea for a cool new feature? Please open an issue using the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) before writing any code. This ensures your idea aligns with the project roadmap and saves you from doing duplicate work!

Thank you for building with us! Let's save the forests together. 🌍
