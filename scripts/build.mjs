import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, cp, rm } from 'node:fs/promises';
// Publish only public assets. Server functions, migrations, tests and dependencies stay outside dist.
await rm('dist',{recursive:true,force:true});
await mkdir('dist/lib',{recursive:true});
for(const entry of await readdir('.',{withFileTypes:true})) {
 if(entry.isFile() && /\.(html|css|js)$/.test(entry.name)) await cp(entry.name,`dist/${entry.name}`);
}
for(const file of ['robots.txt','sitemap.xml']) await cp(file,`dist/${file}`);
await cp('assets','dist/assets',{recursive:true});
await cp('lib/site-plans.mjs','dist/lib/site-plans.mjs');
console.log('Public assets copied to dist; server source excluded.');

execFileSync(process.execPath,[fileURLToPath(new URL('./prepare-site.mjs',import.meta.url))],{cwd:'dist',stdio:'inherit'});
