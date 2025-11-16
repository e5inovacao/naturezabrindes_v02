import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../../supabase/server.ts'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { recipient, status = 'all', page = '1', limit = '20' } = req.query as any
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))
    const from = (pageNum - 1) * limitNum
    let query = supabaseAdmin.from('email_outbox').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (recipient) query = query.ilike('recipient', `%${recipient}%`)
    if (status && status !== 'all') query = query.eq('status', status)
    query = query.range(from, from + limitNum - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: data || [], pagination: { total: count || 0, page: pageNum, limit: limitNum } })
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' })
  }
})

export default router