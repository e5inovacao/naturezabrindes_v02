import React, { useEffect, useState } from 'react'

export default function EmailPreview() {
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('/api/email/preview')
        const text = await resp.text()
        if (!resp.ok) throw new Error(text || 'Falha ao carregar preview')
        setHtml(text)
      } catch (e: any) {
        setError(e?.message || 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="container-custom section-padding">Carregando preview...</div>
  if (error) return <div className="container-custom section-padding text-red-600">{error}</div>

  return (
    <div className="container-custom section-padding">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}