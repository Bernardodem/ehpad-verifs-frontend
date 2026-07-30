import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, Camera, CheckCircle2 } from 'lucide-react';

function ItemCard({ item, resultat, onSave }) {
  const checks = item.checks || ['binaire'];
  const [binaire, setBinaire] = useState(resultat?.conforme ?? null);
  const [quantite, setQuantite] = useState(resultat?.valeur_numerique ?? '');
  const [temperature, setTemperature] = useState(resultat?.valeur_numerique ?? '');
  const [dateP, setDateP] = useState(resultat?.valeur_date ? resultat.valeur_date.split('T')[0] : '');
  const [numero, setNumero] = useState(resultat?.valeur_texte ?? '');
  const [commentaire, setCommentaire] = useState(resultat?.commentaire || '');
  const [photo, setPhoto] = useState(null);

  const calcConformite = (overrides = {}) => {
    const vals = { binaire, quantite, temperature, dateP, numero, ...overrides };
    let ok = true;
    if (checks.includes('binaire')) {
      if (vals.binaire === null) return null;
      ok = ok && vals.binaire === true;
    }
    if (checks.includes('quantite')) {
      if (vals.quantite === '') return null;
      ok = ok && parseFloat(vals.quantite) >= item.seuil_min;
    }
    if (checks.includes('temperature')) {
      if (vals.temperature === '') return null;
      ok = ok && parseFloat(vals.temperature) >= item.temperature_min && parseFloat(vals.temperature) <= item.temperature_max;
    }
    if (checks.includes('peremption')) {
      if (vals.dateP === '') return null;
      ok = ok && new Date(vals.dateP) > new Date();
    }
    if (checks.includes('numero')) {
      if (!vals.numero || vals.numero.trim() === '') return null;
    }
    return ok;
  };

  const persist = (overrides = {}) => {
    const conforme = calcConformite(overrides);
    if (conforme === null) { onSave(null, null); return; }
    const vals = { binaire, quantite, temperature, dateP, numero, commentaire, ...overrides };
    onSave({
      conforme,
      valeur_numerique: checks.includes('quantite') ? parseFloat(vals.quantite) || 0 : (checks.includes('temperature') ? parseFloat(vals.temperature) || 0 : null),
      valeur_date: checks.includes('peremption') ? vals.dateP : null,
      valeur_texte: checks.includes('numero') ? vals.numero : null,
      commentaire: vals.commentaire,
    }, photo);
  };

  const conformeActuel = calcConformite();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <p className="font-medium text-gray-900">{item.libelle}</p>
        {item.emplacement && <p className="text-xs text-gray-400">{item.emplacement}</p>}
      </div>

      {checks.includes('binaire') && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Conforme ?</span>
          <div className="flex gap-2">
            <button onClick={() => { setBinaire(true); persist({ binaire: true }); }} className={`p-2.5 rounded-xl ${binaire === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              <Check size={18} />
            </button>
            <button onClick={() => { setBinaire(false); persist({ binaire: false }); }} className={`p-2.5 rounded-xl ${binaire === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {checks.includes('quantite') && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Quantité (seuil minimum: {item.seuil_min})</p>
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center" value={quantite}
              onChange={e => { setQuantite(e.target.value); persist({ quantite: e.target.value }); }} />
            {quantite !== '' && (parseFloat(quantite) >= item.seuil_min ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-red-500" size={20} />)}
          </div>
        </div>
      )}

      {checks.includes('temperature') && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Température ({item.temperature_min}°C à {item.temperature_max}°C)</p>
          <div className="flex items-center gap-2">
            <input type="number" step="0.1" inputMode="decimal" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center" value={temperature}
              onChange={e => { setTemperature(e.target.value); persist({ temperature: e.target.value }); }} />
            <span className="text-gray-400 text-sm">°C</span>
            {temperature !== '' && (parseFloat(temperature) >= item.temperature_min && parseFloat(temperature) <= item.temperature_max ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-red-500" size={20} />)}
          </div>
        </div>
      )}

      {checks.includes('peremption') && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Date de péremption</p>
          <div className="flex items-center gap-2">
            <input type="date" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={dateP}
              onChange={e => { setDateP(e.target.value); persist({ dateP: e.target.value }); }} />
            {dateP !== '' && (new Date(dateP) > new Date() ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-red-500" size={20} />)}
          </div>
        </div>
      )}

      {checks.includes('numero') && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Numéro / Référence</p>
          <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={numero}
            onChange={e => { setNumero(e.target.value); persist({ numero: e.target.value }); }} />
        </div>
      )}

      {conformeActuel === false && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <textarea
            placeholder="Décrivez le problème..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            onBlur={() => persist()}
          />
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <Camera size={16} />
            {photo ? photo.name : 'Ajouter une photo'}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files[0]; setPhoto(f); persist(); }} />
          </label>
        </div>
      )}
    </div>
  );
}

export default function ExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get(`/executions/${id}`)
      .then(({ data }) => setExecution(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveItem = async (itemId, values, photo) => {
    if (values === null) {
      setExecution(prev => ({
        ...prev,
        items: prev.items.map(it => it.id === itemId ? { ...it, resultat: null } : it)
      }));
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      await api.post(`/executions/${id}/items/${itemId}/resultat`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setExecution(prev => ({
        ...prev,
        items: prev.items.map(it => it.id === itemId ? { ...it, resultat: { ...it.resultat, ...values } } : it)
      }));
    } catch { toast.error('Erreur de sauvegarde'); }
  };

  const terminer = async () => {
    try {
      await api.post(`/executions/${id}/terminer`);
      toast.success('Vérification terminée');
      navigate('/');
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  if (!execution) return null;

  const tousRemplis = execution.items.every(item => item.resultat);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 shadow-md" style={{ background: 'linear-gradient(135deg, #3A2020, #4A2C2A)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-white p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm">{execution.modele_nom}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-3 pb-24">
        {execution.items.map(item => (
          <ItemCard key={item.id} item={item} resultat={item.resultat} onSave={(values, photo) => saveItem(item.id, values, photo)} />
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={terminer}
            disabled={!tousRemplis}
            className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#4A2C2A' }}
          >
            {tousRemplis ? 'Terminer la vérification' : `${execution.items.filter(i => i.resultat).length}/${execution.items.length} points vérifiés`}
          </button>
        </div>
      </div>
    </div>
  );
}
