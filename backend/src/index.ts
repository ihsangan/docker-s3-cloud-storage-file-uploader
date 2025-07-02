import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import dotenv from 'dotenv'
import uploadApp from './upload.js'

dotenv.config()
const PORT = Number(process.env.PORT) || 3300
const app = new Hono()

app.use('*', cors())
app.route('/upload', uploadApp)
app.use('*', serveStatic({ root: './public' }))

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
