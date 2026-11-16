# `tests/samples/` — expected outputs

Committed fixtures for code-sample validation. The only committed sample files are these; `.samples/` (extracted source) is a generated artifact, gitignored and rebuilt by CI via `npm run samples:extract`.

## Layout

```
tests/samples/
  py-001-hello.expected      # expected stdout+stderr for sample id py-001-hello
  py-002-variables.expected
  ...
```

One `<id>.expected` file per sample id, named exactly after the `sample=<id>` info-string in the lesson's fenced code block.

## Sample id format

`<langprefix>-NNN-<name>` — e.g. `py-001-hello`, `js-042-closures`. Unique site-wide (enforced by `scripts/validate.mjs`). Prefixes: `py`, `js`, `ts`, `rs`, `go`, `c`, `cpp`, `java`, `sh`, `sql`.

## Determinism policy

Samples must produce deterministic output:

- No wall-clock time, network access, or unseeded randomness.
- Seeded randomness allowed with a pinned seed.
- Expected-output comparison is byte-exact after trailing-newline normalization.

The CI sample-execution matrix runs samples natively where GitHub runners have toolchains (Python, Node, Rust, Go, GCC/Clang, JDK); Docker jobs cover the rest as tracks are added. Samples for languages without a runner toolchain (MATLAB, SAS, ABAP, Scratch) carry an explicit `review-only` flag in the Code Validator attestation instead of automated execution.
