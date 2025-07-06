import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import from 'dotenv/config'
import uploadApp from './upload'

const PORT: number = Number(process.env.PORT) || 3300
const app = new Hono()

app.route('/upload', uploadApp)
app.use('*', serveStatic({ root: './public' }))

export default {
  fetch: app.fetch,
  port: PORT
}