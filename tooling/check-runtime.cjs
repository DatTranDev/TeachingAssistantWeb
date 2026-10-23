const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
  console.error(
    `Teaching Assistant Web requires Node.js >=24.22.1 <25; found ${process.versions.node}.`
  );
  process.exit(1);
}
