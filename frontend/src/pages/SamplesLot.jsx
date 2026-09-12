import { useEffect, useMemo, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import {
  PRODUCT_TABS,
  sampleStatus,
  emptyForm,
  grainEmptyForm,
} from './samplesLotShared'
import SamplesLotView from './SamplesLotView'

export default function SamplesLot() {
  const [tab, setTab] = useState('torta_cacao')
  const [samples, setSamples] = useState([])
  const [grainSamples, setGrainSamples] = useState([])
  const [lots, setLots] = useState([])
  const [products, setProducts] = useState([])
  const [originsList, setOriginsList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [grainForm, setGrainForm] = useState({ ...grainEmptyForm })
  const [editingGrainId, setEditingGrainId] = useState(null)

  const currentTab = PRODUCT_TABS.find((t) => t.key === tab) || PRODUCT_TABS[0]

  const load = async () => {
    setLoading(true)
    try {
      const [s, g, l, p, o] = await Promise.all([
        samplesApi.listLot(), samplesApi.listGrain(), lotsApi.list(), catalogApi.products(), catalogApi.origins(),
      ])
      setSamples(s.data || [])
      setGrainSamples(g.data || [])
      setLots(l.data || [])
      setProducts(p.data || [])
      setOriginsList(o.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filteredSamples = useMemo(() => {
    if (currentTab.isGrain) return []
    let list = samples.filter((s) => currentTab.match(s.product_name))
    if (filterStatus === 'pendiente') list = list.filter((s) => sampleStatus(s) === 'pendiente')
    if (filterStatus === 'resultado') list = list.filter((s) => sampleStatus(s) === 'resultado')
    return list
  }, [samples, currentTab, filterStatus])

  const filteredLots = useMemo(() => {
    if (currentTab.isGrain) return []
    return lots.filter((l) => currentTab.match(l.product_name))
  }, [lots, currentTab])

  const productIdForTab = useMemo(() => {
    const p = products.find((pr) => currentTab.match(pr.name))
    return p?.id || null
  }, [products, currentTab])

  const counts = useMemo(() => {
    const c = {}
    for (const t of PRODUCT_TABS) {
      if (t.isGrain) c[t.key] = grainSamples.length
      else c[t.key] = samples.filter((s) => t.match(s.product_name)).length
    }
    return c
  }, [samples, grainSamples])

  const pendingCount = useMemo(
    () => samples.filter((s) => currentTab.match(s.product_name) && sampleStatus(s) === 'pendiente').length,
    [samples, currentTab]
  )

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null) }

  const openNew = () => {
    if (currentTab.isGrain) {
      setGrainForm({ ...grainEmptyForm })
      setEditingGrainId(null)
      setShowForm(true)
      return
    }
    resetForm()
    setShowForm(true)
  }

  const openEdit = (sample) => {
    const st = sampleStatus(sample)
    const originNames = (sample.origins_text || sample.observation || '').split(',').map((x) => x.trim()).filter(Boolean)
    setEditingId(sample.id)
    setForm({
      lot_id: String(sample.lot_id),
      lot_code: sample.lot_code || '',
      send_date: sample.send_date || '',
      origins: originNames,
      estado: st === 'resultado' ? 'resultado' : 'pendiente',
      cadmium_mg_kg: sample.cadmium_mg_kg != null ? String(sample.cadmium_mg_kg) : '',
    })
    setShowForm(true)
  }

  const openEditGrain = (s) => {
    setEditingGrainId(s.id)
    setGrainForm({
      origin_id: String(s.origin_id || ''),
      guia_code: s.guia_code || '',
      send_date: s.send_date || '',
      estado: s.has_sample && s.cadmium_mg_kg != null ? 'resultado' : 'pendiente',
      cadmium_mg_kg: s.cadmium_mg_kg != null ? String(s.cadmium_mg_kg) : '',
    })
    setShowForm(true)
  }

  const resolveLotId = async () => {
    if (form.lot_id) return Number(form.lot_id)
    const code = (form.lot_code || '').trim()
    if (!code) throw new Error('Indica un código de lote')
    if (!productIdForTab) throw new Error('No se encontró el producto de esta pestaña')
    const existing = lots.find((l) => l.lot_code.toLowerCase() === code.toLowerCase())
    if (existing) return existing.id
    const res = await lotsApi.create({ product_id: productIdForTab, lot_code: code, origins: [] })
    return res.data.id
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isResultado = form.estado === 'resultado'
      const cd = form.cadmium_mg_kg === '' ? null : Number(form.cadmium_mg_kg)
      const originsText = form.origins.join(', ')
      const payload = {
        cadmium_mg_kg: isResultado ? cd : null,
        has_sample: isResultado && cd != null,
        send_date: form.send_date || null,
        observation: originsText || null,
      }
      if (editingId) await samplesApi.updateLot(editingId, payload)
      else {
        const lotId = await resolveLotId()
        await samplesApi.createLot({ lot_id: lotId, ...payload })
      }
      setShowForm(false)
      resetForm()
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleGrainSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (!grainForm.origin_id) throw new Error('Selecciona un origen / zona')
      if (!grainForm.guia_code.trim()) throw new Error('Indica el código de guía')
      const isResultado = grainForm.estado === 'resultado'
      const cd = grainForm.cadmium_mg_kg === '' ? null : Number(grainForm.cadmium_mg_kg)
      const payload = {
        origin_id: Number(grainForm.origin_id),
        guia_code: grainForm.guia_code.trim(),
        send_date: grainForm.send_date || null,
        cadmium_mg_kg: isResultado ? cd : null,
        has_sample: isResultado && cd != null,
      }
      if (editingGrainId) await samplesApi.updateGrain(editingGrainId, payload)
      else await samplesApi.createGrain(payload)
      setShowForm(false)
      setGrainForm({ ...grainEmptyForm })
      setEditingGrainId(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <SamplesLotView
      tab={tab} setTab={setTab} currentTab={currentTab} counts={counts}
      pendingCount={pendingCount} openNew={openNew} showForm={showForm}
      editingGrainId={editingGrainId} grainForm={grainForm} setGrainForm={setGrainForm}
      handleGrainSubmit={handleGrainSubmit} saving={saving} setShowForm={setShowForm}
      setEditingGrainId={setEditingGrainId}
      originsList={originsList} editingId={editingId} form={form} setForm={setForm}
      handleSubmit={handleSubmit} filteredLots={filteredLots} filteredSamples={filteredSamples}
      filterStatus={filterStatus} setFilterStatus={setFilterStatus} loading={loading}
      openEdit={openEdit} grainSamples={grainSamples} openEditGrain={openEditGrain}
    />
  )
}
