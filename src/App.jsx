import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Components from '@/pages/Components'
import Projects from '@/pages/Projects'
import Students from '@/pages/Students'
import StockMovements from '@/pages/StockMovements'
import Storage from '@/pages/Storage'
import Reports from '@/pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="components" element={<Components />} />
          <Route path="projects" element={<Projects />} />
          <Route path="students" element={<Students />} />
          <Route path="stock" element={<StockMovements />} />
          <Route path="storage" element={<Storage />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
