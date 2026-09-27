import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const output = ".amplify-hosting";
const compute = `${output}/compute/default`;

await rm(output, { recursive: true, force: true });
await mkdir(compute, { recursive: true });
await cp("dist/client", `${output}/static`, { recursive: true });
await cp("dist/server", compute, { recursive: true });
await cp("scripts/amplify-server.mjs", `${compute}/amplify-server.mjs`);

const manifest = {
  version: 1,
  framework: { name: "tanstack-start", version: "1" },
  routes: [
    {
      path: "/*.*",
      target: { kind: "Static", cacheControl: "public, max-age=31536000, immutable" },
      fallback: { kind: "Compute", src: "default" },
    },
    { path: "/*", target: { kind: "Compute", src: "default" } },
  ],
  computeResources: [{ name: "default", runtime: "nodejs22.x", entrypoint: "amplify-server.mjs" }],
};

await writeFile(`${output}/deploy-manifest.json`, JSON.stringify(manifest, null, 2));
