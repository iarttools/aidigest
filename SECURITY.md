# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's **Report a vulnerability** button in the repository's Security tab, or contact the maintainers privately through the GitHub profile.

Include a short description, affected version or commit, reproduction steps, and the smallest safe proof you can provide. Never include API keys, private URLs, personal data, or real credentials.

aidigest is designed to run locally, but it can fetch URLs and optionally expose a local proxy. A report involving SSRF, unsafe URL handling, credential leakage, prompt-injection bypass, arbitrary file writes, or release/build integrity is especially valuable.

## Supported versions

The latest release and the default branch receive fixes. Older releases may not receive backports; upgrade before reporting a problem that only affects an obsolete version.

## Disclosure

We will acknowledge a valid report, investigate it, and coordinate a fix and public disclosure with the reporter when appropriate. Please allow time for a fix before sharing details publicly.

