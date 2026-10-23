// Next's root-directory resolver uses only globSync, with onlyDirectories enabled.
const { globSync } = require('tinyglobby');
const path = require('node:path');
exports.globSync = (patterns, options = {}) =>
  globSync(patterns, {
    ...options,
    absolute: options.absolute ?? (typeof patterns === 'string' && path.isAbsolute(patterns)),
    expandDirectories: false,
  }).map((directory) =>
    directory === '/' || /^[A-Za-z]:\/$/.test(directory) ? directory : directory.replace(/\/$/, '')
  );
