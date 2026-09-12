import { useEffect, useMemo, useRef, useState } from 'react'
import { samplesApi, lotsApi, catalogApi } from '../lib/api'
import { Plus, Search, X, Pencil, FlaskConical, Clock, CheckCircle2, ChevronDown } from 'lucide-react'

const PRODUCT_TABS = [
  { key: 'torta_cacao', label: 'Torta de cacao', match: (n) => n && n.toLowerCase() === 'torta de cacao' },
  { key: 'torta_alcalino', label: 'Torta de cacao alcalino', match: (n) => n && n.toLowerCase().includes('torta de cacao alcalino') },
  { key: 'cacao_alcalino', label: 'Cacao alcalino', match: (n) => n && n.toLowerCase().includes('cacao alcalino') && !n.toLowerCase().includes('torta') },
  { key: 'cacao_polvo', label: 'Cacao en polvo', match: (n) => n && n.toLowerCase().includes('polvo') },
  { key: 'grano', label: 'Grano de cacao', match: () => false, isGrain: true },
]
