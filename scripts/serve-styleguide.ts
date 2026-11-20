// Serves the built style guide for the browser tests, as "vitepress preview" does, on a port
// the system picks, and prints where. A run of the tests reads the address from that line, so
// it tests the build of its own copy of the repository, whatever else the machine is serving.
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { join, resolve } from 'node:path'
import { serve } from 'vitepress'

const root = resolve(import.meta.dirname, '..')

const { server } = await serve({ root: join(root, 'styleguide'), port: 0 })
if (!server.listening) await once(server, 'listening')
// VitePress has printed the port it was asked for, which is 0. This is the one it got.
const { port } = server.address() as AddressInfo
console.log(`style guide served at http://127.0.0.1:${port}`)
