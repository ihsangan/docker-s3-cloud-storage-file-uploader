import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import dotenv from 'dotenv'
import uploadApp from './upload'

dotenv.config()
const PORT = Number(process.env.PORT) || 3300
const app = new Hono()

app.route('/upload', uploadApp)
app.use('*', serveStatic({ root: './public' }))

export default {
  fetch: app.fetch,
  port: PORT
}