import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { chargeApp } from '@/lib/mpp-server'

const app = new Hono().basePath('/api/charge')
app.route('/', chargeApp)

export const GET = handle(app)
