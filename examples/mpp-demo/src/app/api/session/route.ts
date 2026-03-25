import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { sessionApp } from '@/lib/mpp-server'

const app = new Hono().basePath('/api/session')
app.route('/', sessionApp)

export const GET = handle(app)
