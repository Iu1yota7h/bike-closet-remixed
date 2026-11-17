import test from 'node:test';import assert from 'node:assert/strict';import {checkReactPeers} from './check-react-peers.mjs';
const pkg=(react,dom,server)=>({dependencies:{react,'react-dom':dom,'react-server-dom-webpack':server}});
test('accepts matching React versions',()=>assert.equal(checkReactPeers(pkg('19.3.1','19.3.1','19.3.1')),'19.3.1'));
test('rejects the PR22 mismatch and nonexact or missing peers',()=>{for(const p of [pkg('19.3.0','19.3.0','19.3.1'),pkg('^19.3.1','19.3.1','19.3.1'),pkg('19.3.1','19.3.1',undefined)])assert.throws(()=>checkReactPeers(p));});
