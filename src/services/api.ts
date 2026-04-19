import axios from 'axios'
import { supabase } from '../config/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
})

// Inject Auth Token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export interface LocationOnboardingStats {
  city: string
  pharmacy_count: number
  doctor_count: number
  is_medicine_active: boolean
  is_doctor_active: boolean
  is_city_active: boolean
}

export interface ServiceableHub {
  id: string
  hub_name: string
  city_name: string
  center_lat: number
  center_lng: number
  radius_km: number
  medicine_active: boolean
  doctor_active: boolean
  is_active: boolean
}

export const adminApi = {
  getOnboardingStats: () => 
    api.get<{ success: boolean; data: LocationOnboardingStats[] }>('/admin/onboarding-stats').then(res => res.data.data),
  
  getHubs: () => 
    api.get<{ success: boolean; data: ServiceableHub[] }>('/admin/locations').then(res => res.data.data),
  
  addHub: (data: { hub_name: string, city_name: string, center_lat: number, center_lng: number, radius_km: number }) => 
    api.post('/admin/locations', data).then(res => res.data),
  
  updateHubStatus: (id: string, updates: Partial<ServiceableHub>) => 
    api.patch(`/admin/locations/${id}`, updates).then(res => res.data)
}
