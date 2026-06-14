- [ ] Identify all filesystem writes causing ENOENT: mkdir '/var/task/.data' (search for `.data` and `var/task`)
- [ ] Apply the same “skip persistence on absolute/unwritable paths” fix to all repository/persistence modules (e.g. competition store, other in-memory stores)
- [ ] Ensure persistence paths are defaulted to a safe relative directory in dev/prod
- [ ] Re-test build/deploy

