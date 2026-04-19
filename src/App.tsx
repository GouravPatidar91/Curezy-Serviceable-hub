import React, { useEffect, useState } from 'react'
import { 
  Activity, 
  MapPin, 
  Stethoscope, 
  Pill, 
  Plus, 
  TrendingUp, 
  ShieldCheck,
  LogOut,
  Edit2
} from 'lucide-react'
import { adminApi } from './services/api'
import type { LocationOnboardingStats, ServiceableHub } from './services/api'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import AuthLayout from './components/AuthLayout'
import { supabase } from './config/supabase'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function App() {
  const isConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_API_URL

  if (!isConfigured) {
    return <ConfigGuard />
  }

  return (
    <AuthLayout>
      <AdminDashboard />
    </AuthLayout>
  )
}

function ConfigGuard() {
  return (
    <div className="min-h-screen bg-[#0a0f18] text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black">
      <div className="max-w-md w-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 text-center shadow-2xl">
        <div className="w-20 h-20 bg-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
          <ShieldAlert size={40} className="text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Setup Required</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The Curezy Admin Panel is live, but it's missing the critical connections to your secure modules.
        </p>
        
        <div className="space-y-3 text-left mb-8">
          <ConfigStep label="VITE_SUPABASE_URL" active={!!import.meta.env.VITE_SUPABASE_URL} />
          <ConfigStep label="VITE_SUPABASE_ANON_KEY" active={!!import.meta.env.VITE_SUPABASE_ANON_KEY} />
          <ConfigStep label="VITE_API_URL" active={!!import.meta.env.VITE_API_URL} />
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-sm flex gap-3 mb-8">
          <AlertCircle size={32} className="shrink-0" />
          <p>Add these to your <b>Vercel Project Settings</b> and redeploy the site.</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          Check Connectivity
        </button>
      </div>
    </div>
  )
}

function ConfigStep({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl border transition-all",
      active ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-slate-900/50 border-slate-700 text-slate-500"
    )}>
      <span className="font-mono text-sm">{label}</span>
      {active ? <CheckCircle size={16} /> : <XCircle size={16} />}
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState<LocationOnboardingStats[]>([])
  const [hubs, setHubs] = useState<ServiceableHub[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showAddHub, setShowAddHub] = useState(false)
  const [newHub, setNewHub] = useState({ hub_name: '', city_name: '', center_lat: '', center_lng: '', radius_km: '3.0' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, hubsData] = await Promise.all([
        adminApi.getOnboardingStats(),
        adminApi.getHubs()
      ])
      setStats(statsData)
      setHubs(hubsData)
      setFetchError(null)
    } catch (err: any) {
      console.error('Failed to fetch data', err)
      const errorMsg = err.response?.data?.error || err.message || 'Connection failed'
      // If it's a CORS error (no response), provide a specific tip
      if (!err.response && err.message === 'Network Error') {
        setFetchError('CORS_BLOCK')
      } else {
        setFetchError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: string, field: 'medicine_active' | 'doctor_active' | 'is_active', current: boolean) => {
    try {
      await adminApi.updateHubStatus(id, { [field]: !current })
      fetchData()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleUpdateRadius = async (id: string, currentRadius: number) => {
    const newRadius = window.prompt(`Enter new radius for this hub (current: ${currentRadius} km):`, currentRadius.toString())
    if (newRadius === null || isNaN(parseFloat(newRadius))) return

    try {
      await adminApi.updateHubStatus(id, { radius_km: parseFloat(newRadius) })
      fetchData()
    } catch (err) {
      alert('Failed to update radius')
    }
  }

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
        await adminApi.addHub({
          hub_name: newHub.hub_name,
          city_name: newHub.city_name,
          center_lat: parseFloat(newHub.center_lat),
          center_lng: parseFloat(newHub.center_lng),
          radius_km: parseFloat(newHub.radius_km)
        })
        setShowAddHub(false)
        setNewHub({ hub_name: '', city_name: '', center_lat: '', center_lng: '', radius_km: '3.0' })
        await fetchData()
    } catch (err: any) {
        console.error('Add Hub Error:', err)
        const message = err.response?.data?.error || err.message || 'Failed to add hub'
        alert(`Error: ${message}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
            Service Control Center
          </h1>
          <p className="text-slate-400 mt-2">Manage Curezy expansion and serviceability status across India.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-semibold transition-all border border-slate-700"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          
          <button 
            onClick={() => setShowAddHub(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus size={20} />
            Register Service Hub
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        {/* Connection Warning */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <ShieldAlert size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-red-200 font-semibold leading-none mb-1">
                  {fetchError === 'CORS_BLOCK' ? 'CORS Security Block' : 'API Connection Error'}
                </p>
                <p className="text-red-400/80 text-sm">
                  {fetchError === 'CORS_BLOCK' 
                    ? 'Your browser blocked the request. Check Render ALLOWED_ORIGINS.' 
                    : fetchError}
                </p>
              </div>
            </div>
            <button 
              onClick={() => fetchData()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-sm font-bold transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
            title="Active Hubs" 
            value={hubs.filter(h => h.is_active).length} 
            icon={<MapPin className="text-primary-400" />} 
            trend="+2 this month"
           />
           <StatCard 
            title="Onboarded Doctors" 
            value={stats.reduce((acc, curr) => acc + Number(curr.doctor_count), 0)} 
            icon={<Stethoscope className="text-indigo-400" />} 
            trend="Live coverage"
           />
           <StatCard 
            title="Pharmacy Partners" 
            value={stats.reduce((acc, curr) => acc + Number(curr.pharmacy_count), 0)} 
            icon={<Pill className="text-emerald-400" />} 
            trend="15-min ready"
           />
           <StatCard 
            title="Global Status" 
            value="Operational" 
            icon={<ShieldCheck className="text-primary-500" />} 
            trend="All systems green"
           />
        </section>

        {/* Location Management Table */}
        <section className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity size={20} className="text-primary-400" />
              Geographic Expansion Tracker
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <th className="px-8 py-6">Hub / Area</th>
                  <th className="px-8 py-6">GPS / Radius</th>
                  <th className="px-8 py-6">Onboarding</th>
                  <th className="px-8 py-6">Medicine</th>
                  <th className="px-8 py-6">Doctor</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500">Loading hub data...</td></tr>
                ) : hubs.map((hub) => {
                  const cityStats = stats.find(s => {
                    const statsCity = (s.city || (s as any).city_name)?.toLowerCase().trim()
                    const hubCity = hub.city_name?.toLowerCase().trim()
                    return statsCity === hubCity
                  })
                  return (
                    <tr key={hub.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-lg text-white">{hub.hub_name}</div>
                        <div className="text-sm text-slate-500 uppercase tracking-wider">{hub.city_name}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 group/radius">
                          <div className="font-medium text-slate-300">R: {hub.radius_km} km</div>
                          <button 
                            onClick={() => handleUpdateRadius(hub.id, hub.radius_km)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover/radius:opacity-100"
                            title="Edit Radius"
                          >
                            <Edit2 size={12} className="text-primary-400" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{hub.center_lat.toFixed(4)}, {hub.center_lng.toFixed(4)}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                            <CountBadge icon={<Stethoscope size={12}/>} count={cityStats?.doctor_count || 0} label="Doc" />
                            <CountBadge icon={<Pill size={12}/>} count={cityStats?.pharmacy_count || 0} label="Pharma" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <Toggle 
                            active={hub.medicine_active} 
                            onClick={() => toggleStatus(hub.id, 'medicine_active', hub.medicine_active)} 
                            label=""
                         />
                      </td>
                      <td className="px-8 py-6">
                         <Toggle 
                            active={hub.doctor_active} 
                            onClick={() => toggleStatus(hub.id, 'doctor_active', hub.doctor_active)} 
                            label=""
                         />
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => toggleStatus(hub.id, 'is_active', hub.is_active)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                    hub.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50" : "bg-slate-700 text-slate-400"
                                )}
                            >
                                {hub.is_active ? 'Live' : 'Hidden'}
                            </button>
                         </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add Hub Modal */}
      {showAddHub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-xl shadow-2xl my-auto">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <MapPin className="text-primary-400" />
                  Define Service Hub
                </h3>
                <form onSubmit={handleAddHub} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Hub Name (Area/Zone)</label>
                        <input 
                            required
                            value={newHub.hub_name}
                            onChange={e => setNewHub({...newHub, hub_name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g. Vijay Nagar Hub"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">City</label>
                        <input 
                            required
                            value={newHub.city_name}
                            onChange={e => setNewHub({...newHub, city_name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g. Indore"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Radius (KM)</label>
                        <input 
                            required
                            type="number"
                            step="0.1"
                            value={newHub.radius_km}
                            onChange={e => setNewHub({...newHub, radius_km: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Latitude</label>
                        <input 
                            required
                            type="number"
                            step="0.000001"
                            value={newHub.center_lat}
                            onChange={e => setNewHub({...newHub, center_lat: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g. 22.7533"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Longitude</label>
                        <input 
                            required
                            type="number"
                            step="0.000001"
                            value={newHub.center_lng}
                            onChange={e => setNewHub({...newHub, center_lng: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g. 75.8937"
                        />
                    </div>
                    
                    <div className="md:col-span-2 flex gap-4 mt-8">
                        <button 
                            type="button"
                            onClick={() => setShowAddHub(false)}
                            className="flex-1 px-6 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95"
                        >
                            Register Hub
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl group hover:border-primary-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900/50 rounded-2xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="text-xs font-bold text-primary-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-slate-500 text-sm font-medium">{title}</div>
        </div>
    )
}

function Toggle({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-3 group transition-all"
        >
            <div className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-300",
                active ? "bg-primary-500" : "bg-slate-700"
            )}>
                <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                    active ? "translate-x-6" : "translate-x-0"
                )} />
            </div>
            <span className={cn(
                "text-sm font-semibold transition-colors",
                active ? "text-slate-200" : "text-slate-500"
            )}>
                {label}
            </span>
        </button>
    )
}

function CountBadge({ icon, count, label }: { icon: React.ReactNode, count: number, label: string }) {
    return (
        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span className="text-slate-400">{icon}</span>
            <span className="font-bold text-slate-200">{count}</span>
            <span className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">{label}</span>
        </div>
    )
}
