import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function checkReactPeers(pkg){
 const names=['react','react-dom','react-server-dom-webpack'];
 const versions=names.map(name=>pkg.dependencies?.[name]);
 if(versions.some(version=>typeof version!=='string'||!/^\d+\.\d+\.\d+$/.test(version))||new Set(versions).size!==1)throw Error('React, React DOM and React Server DOM Webpack must have the same exact version');
 return versions[0];
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));console.log('React peer versions aligned:',checkReactPeers(pkg));}
