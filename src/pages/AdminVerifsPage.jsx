import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';

const PERIODICITES = [
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'a_la_demande', label: 'À la demande' },
];

const TYPES_ITEM = [
  { value: 'binaire', label: 'Oui / Non' },
  { value: 'quantite', label: 'Quantité (seuil)' },
  { value: 'temperature', label: 'Température (plage)' },
  { value: 'peremption', label: 'Date de péremption' },
];

function NewModeleModal({ metiers, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', description: '', periodicite: 'quotidien', metier_responsable_id: '', heure_limite: '' });
  const [metiersAlerte, setMetiersAlerte] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems(p => [...p, { libelle: '', type: 'binaire', seuil_min: '', temperature_min: '', temperature_max: '', emplacement: '' }]);
  };

  const updateItem = (idx, field, value) => {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.nom) { toast.error('Nom requis'); return; }
    if (items.length === 0) { toast.error('Ajoutez au moins un point à vérifier'); return; }
    setLoading(true);
    try {
      await api.post('/modeles', { ...form, items, metiers_alerte: metiersAlerte });
      toast.success('Vérification créée');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">Nouvelle vérification</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Nom</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Vérification quotidienne matériel d'urgence" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Périodicité</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.periodicite} onChange={e => setForm(p => ({...p, periodicite: e.target.value}))}>
                {PERIODICITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Heure limite</label>
              <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.heure_limite} onChange={e => setForm(p => ({...p, heure_limite: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Métier responsable</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.metier_responsable_id} onChange={e => setForm(p => ({...p, metier_responsable_id: e.target.value}))}>
              <option value="">— Aucun —</option>
              {metiers.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Alerter en cas de retard</label>
            <div className="flex flex-wrap gap-2">
              {metiers.map(m => (
                <label key={m.id} className={`text-xs px-3 py-1.5 rounded-full cursor-pointer border ${metiersAlerte.includes(m.id) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={metiersAlerte.includes(m.id)}
                    onChange={e => setMetiersAlerte(p => e.target.checked ? [...p, m.id] : p.filter(id => id !== m.id))}
                  />
                  {m.nom}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Points à vérifier</p>
            <button onClick={addItem} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1" style={{ background: '#4A2C2A' }}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Libellé (ex: Le DSA clignote vert)" value={item.libelle} onChange={e => updateItem(idx, 'libelle', e.target.value)} />
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)}>
                    {TYPES_ITEM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Emplacement" value={item.emplacement} onChange={e => updateItem(idx, 'emplacement', e.target.value)} />
                </div>
                {item.type === 'quantite' && (
                  <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Seuil minimum" value={item.seuil_min} onChange={e => updateItem(idx, 'seuil_min', e.target.value)} />
                )}
                {item.type === 'temperature' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Temp. min °C" value={item.temperature_min} onChange={e => updateItem(idx, 'temperature_min', e.target.value)} />
                    <input type="number" className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Temp. max °C" value={item.temperature_max} onChange={e => updateItem(idx, 'temperature_max', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun point ajouté</p>}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={save} disabled={loading} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4A2C2A' }}>
            {loading ? 'Création...' : 'Créer'}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600">Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerifsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [modeles, setModeles] = useState([]);
  const [metiers, setMetiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [m, met] = await Promise.all([
        api.get('/modeles'),
        fetch('/sso/api/apps/metiers/all', { headers: { Authorization: `Bearer ${localStorage.getItem('sso_token')}` } }).then(r => r.json())
      ]);
      setModeles(m.data);
      setMetiers(met);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 shadow-md" style={{ background: 'linear-gradient(135deg, #3A2020, #4A2C2A)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-white p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm">Administration</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4A2C2A' }}>
            <Plus size={16} /> Nouvelle vérification
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : (
          <div className="space-y-3">
            {modeles.map(m => (
              <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{m.nom}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{m.periodicite.replace('_', ' ')} {m.heure_limite && `· avant ${m.heure_limite}`}</p>
              </div>
            ))}
            {modeles.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>Aucune vérification configurée</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showNew && <NewModeleModal metiers={metiers} onClose={() => setShowNew(false)} onSaved={load} />}
    </div>
  );
}
