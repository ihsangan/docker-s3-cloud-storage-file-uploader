import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import dotenv from 'dotenv'
import uploadApp from './upload'

dotenv.config()
const PORT = Number(process.env.PORT) || 3300
const app = new Hono()

const manifest = import.meta.glob('./public/**/*', {
  eager: true,
  as: 'file',
})

app.route('/upload', uploadApp)
app.use('*', serveStatic({
  manifest,
  rewriteRequestPath: (path) => {
    if (path === '/') return './public/index.html'
    return `./public${path}`
  },
}))

export default {
  fetch: app.fetch,
  port: PORT
}
