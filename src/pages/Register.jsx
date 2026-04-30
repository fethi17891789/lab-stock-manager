import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Zap, GraduationCap, BookOpen, FlaskConical, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const roles = [
  {
    value: 'student',
    label: 'Étudiant',
    description: 'Accès à mes projets',
    icon: GraduationCap,
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
    iconColor: 'text-blue-500',
  },
  {
    value: 'teacher',
    label: 'Enseignant',
    description: 'Gestion des projets',
    icon: BookOpen,
    color: 'border-violet-200 bg-violet-50 text-violet-700',
    activeColor: 'border-violet-500 bg-violet-50 ring-2 ring-violet-500',
    iconColor: 'text-violet-500',
  },
  {
    value: 'laborantin',
    label: 'Laborantin',
    description: 'Accès complet au stock',
    icon: FlaskConical,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    activeColor: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500',
    iconColor: 'text-emerald-500',
  },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstname: '', name: '', email: '', password: '', role: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.role) { setError('Veuillez choisir un rôle.'); return }
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        role: form.role,
        name: form.name,
        firstname: form.firstname,
      })
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LabStock</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion de composants électroniques</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Créer un compte</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input
                  placeholder="Prénom"
                  value={form.firstname}
                  onChange={e => setForm(f => ({ ...f, firstname: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input
                  placeholder="Nom"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Adresse email *</Label>
              <Input
                type="email"
                placeholder="exemple@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mot de passe *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6 caractères minimum"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label>Je suis... *</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label, description, icon: Icon, color, activeColor, iconColor }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: value }))}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                      ${form.role === value ? activeColor : `${color} hover:opacity-80`}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {loading ? 'Création du compte...' : "S'inscrire"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-violet-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
