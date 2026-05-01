const content = `
_worker.js
../server
`;
await Bun.write("dist/.assetsignore", content);

export {};
