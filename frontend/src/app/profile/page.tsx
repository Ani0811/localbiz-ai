"use client";

import { useEffect, useState } from 'react';
import { 
  Store, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2,
  Tag
} from 'lucide-react';
import { api } from '@/lib/api';
import { BusinessProfile, ProductServiceItem } from '@/lib/types';

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('Professional and Welcoming');
  const [language, setLanguage] = useState('English');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [productsServices, setProductsServices] = useState<ProductServiceItem[]>([]);

  const tonesList = [
    'Professional and Welcoming',
    'Warm, Friendly and Casual',
    'Energetic, Trendy and Youthful',
    'Authentic, Artisanal and Nostalgic',
    'Luxurious, Elegant and Premium',
    'Urgent, Value-Driven and Promotional',
    'Empathetic and Health-Conscious'
  ];

  const languagesList = [
    { value: 'English', label: 'English' },
    { value: 'Bengali', label: 'Bengali (বাংলা)' },
    { value: 'Bengali-English', label: 'Bengali-English (Benglish)' }
  ];

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);
      if (data.length > 0) {
        const current = data.find((p) => p.is_active) || data[0];
        selectProfile(current);
      } else {
        // defaults
        setName('');
        setCategory('');
        setDescription('');
        setLocation('');
        setBusinessHours('');
        setTargetAudience('');
        setProductsServices([
          { name: '', description: '', price: '', offer: '' }
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const selectProfile = (p: BusinessProfile) => {
    setActiveProfileId(p.id);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description);
    setLocation(p.location);
    setBusinessHours(p.business_hours);
    setTargetAudience(p.target_audience);
    setTone(p.tone || 'Professional and Welcoming');
    setLanguage(p.language || 'English');
    setContactPhone(p.contact_phone || '');
    setContactEmail(p.contact_email || '');
    setWebsiteUrl(p.website_url || '');
    setProductsServices(p.products_services || []);
  };

  const addProductItem = () => {
    setProductsServices([...productsServices, { name: '', description: '', price: '', offer: '' }]);
  };

  const removeProductItem = (index: number) => {
    setProductsServices(productsServices.filter((_, i) => i !== index));
  };

  const updateProductItem = (index: number, field: keyof ProductServiceItem, value: string) => {
    const updated = [...productsServices];
    updated[index] = { ...updated[index], [field]: value };
    setProductsServices(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    const validProducts = productsServices.filter((p) => p.name.trim() !== '');

    const payload = {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      location: location.trim(),
      business_hours: businessHours.trim(),
      target_audience: targetAudience.trim(),
      tone,
      language,
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      website_url: websiteUrl.trim(),
      products_services: validProducts
    };

    try {
      if (activeProfileId) {
        await api.updateProfile(activeProfileId, payload);
      } else {
        const created = await api.createProfile(payload);
        setActiveProfileId(created.id);
      }
      setSaveSuccess(true);
      await loadProfiles();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile? All saved history for this profile will be removed.')) return;
    try {
      await api.deleteProfile(id);
      setActiveProfileId(null);
      await loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.setActiveProfile(id);
      await loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to activate profile');
    }
  };

  const handleCreateNew = () => {
    setActiveProfileId(null);
    setName('');
    setCategory('');
    setDescription('');
    setLocation('');
    setBusinessHours('');
    setTargetAudience('');
    setTone('Professional and Welcoming');
    setLanguage('English');
    setContactPhone('');
    setContactEmail('');
    setWebsiteUrl('');
    setProductsServices([{ name: '', description: '', price: '', offer: '' }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            Business Profile & Factual Source of Truth
          </h1>
          <p className="text-sm text-slate-400">
            The details here are strictly enforced. The AI will never invent prices, offers, or contact info not listed here.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Add Another Business
        </button>
      </div>

      {/* Profiles tabs if multiple */}
      {profiles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => selectProfile(p)}
              className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors shrink-0 ${
                activeProfileId === p.id
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{p.name}</span>
              {p.is_active && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Business profile successfully saved and persisted to local SQLite database!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Core Details */}
          <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              General Business Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Street Cafe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category / Industry *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artisanal Bakery, Dental Clinic, Salon"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your story, specialities, origin, and what makes your business unique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Location / Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14 Park Street, Kolkata"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operating Hours *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon-Sat 8:00 AM - 9:00 PM (Closed Sundays)"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Audience Demographics & Traits *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Neighborhood families, college students, health-conscious professionals"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Column 2: Brand Voice & Contact */}
          <div className="space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Tone & Contact Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Preferred Brand Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                {tonesList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Marketing Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                {languagesList.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Public Email
              </label>
              <input
                type="email"
                placeholder="contact@mybusiness.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Website / Social Link
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/mybusiness"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Catalog of Products, Services, & Offers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Products, Services & Promotional Offers
              </h3>
              <p className="text-xs text-slate-400">
                Add exact prices and discounts. The model will reference these figures verbatim.
              </p>
            </div>
            <button
              type="button"
              onClick={addProductItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product / Service
            </button>
          </div>

          <div className="space-y-3">
            {productsServices.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sourdough Loaf"
                    value={item.name}
                    onChange={(e) => updateProductItem(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Exact Price / Rate</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹180 or $12"
                    value={item.price || ''}
                    onChange={(e) => updateProductItem(idx, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Current Offer / Deal</label>
                  <input
                    type="text"
                    placeholder="e.g. Buy 2 get 1 croissant free"
                    value={item.offer || ''}
                    onChange={(e) => updateProductItem(idx, 'offer', e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5 sm:pt-0">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Brief Details</label>
                    <input
                      type="text"
                      placeholder="e.g. 36hr fermented"
                      value={item.description || ''}
                      onChange={(e) => updateProductItem(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductItem(idx)}
                    className="mt-5 p-2 rounded-md bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {activeProfileId && (
              <>
                <button
                  type="button"
                  onClick={() => handleSetActive(activeProfileId)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Set as Active Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(activeProfileId)}
                  className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
                >
                  Delete Profile
                </button>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {saving ? (
              <>Saving to SQLite...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Business Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
