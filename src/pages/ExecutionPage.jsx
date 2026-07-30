import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, Camera, CheckCircle2 } from 'lucide-react';

function ItemBinaire({ item, resultat, onSave }) {
  const [conforme, setConforme] = useState(resultat?.conforme ?? null);
  const [commentaire, setCommentaire] = useState(resultat?.commentaire || '');
  const [photo, setPhoto] = useState(null);

  const save = (val) => {
    setConforme(val);
    onSave({ conforme: val, commentaire }, photo);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{item.libelle}</p>
          {item.emplacement && <p className="text-xs text-gray-400">{item.emplacement}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(true)} className={`p-3 rounded-xl ${conforme === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Check size={22} />
          </button>
          <button onClick={() => save(false)} className={`p-3 rounded-xl ${conforme === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <X size={22} />
          </button>
        </div>
      </div>
      {conforme === false && (
        <div className="mt-3 space-y-2">
          <textarea
            placeholder="Décrivez le problème..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            onBlur={() => onSave({ conforme: false, commentaire }, photo)}
          />
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <Camera size={16} />
            {photo ? photo.name : 'Ajouter une photo'}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files[0]; setPhoto(f); onSave({ conforme: false, commentaire }, f); }} />
          </label>
        </div>
      )}
    </div>
  );
}

function ItemQuantite({ item, resultat, onSave }) {
  const [valeur, setValeur] = useState(resultat?.valeur_numerique ?? '');

  const conforme = valeur !== '' && parseFloat(valeur) >= item.seuil_min;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="font-medium text-gray-900 mb-1">{item.libelle}</p>
      {item.emplacement && <p className="text-xs text-gray-400 mb-2">{item.emplacement}</p>}
      <p className="text-xs text-gray-400 mb-2">Seuil minimum: {item.seuil_min}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-lg text-center"
          value={valeur}
          onChange={e => setValeur(e.target.value)}
          onBlur={() => onSave({ conforme, valeur_numerique: parseFloat(valeur) || 0 })}
        />
        {valeur !== '' && (
          conforme ? <CheckCircle2 className="text-green-500" size={24} /> : <X className="text-red-500" size={24} />
        )}
      </div>
    </div>
  );
}

function ItemTemperature({ item, resultat, onSave }) {
  const [valeur, setValeur] = useState(resultat?.valeur_numerique ?? '');

  const conforme = valeur !== '' && parseFloat(valeur) >= item.temperature_min && parseFloat(valeur) <= item.temperature_max;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="font-medium text-gray-900 mb-1">{item.libelle}</p>
      {item.emplacement && <p className="text-xs text-gray-400 mb-2">{item.emplacement}</p>}
      <p className="text-xs text-gray-400 mb-2">Plage: {item.temperature_min}°C à {item.temperature_max}°C</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          step="0.1"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-lg text-center"
          value={valeur}
          onChange={e => setValeur(e.target.value)}
          onBlur={() => onSave({ conforme, valeur_numerique: parseFloat(valeur) || 0 })}
        />
        <span className="text-gray-400">°C</span>
        {valeur !== '' && (
          conforme ? <CheckCircle2 className="text-green-500" size={24} /> : <X className="text-red-500" size={24} />
        )}
      </div>
    </div>
  );
}

function ItemPeremption({ item, resultat, onSave }) {
  const [valeur, setValeur] = useState(resultat?.valeur_date ? resultat.valeur_date.split('T')[0] : '');

  const conforme = valeur !== '' && new Date(valeur) > new Date();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="font-medium text-gray-900 mb-1">{item.libelle}</p>
      {item.emplacement && <p className="text-xs text-gray-400 mb-2">{item.emplacement}</p>}
      <div className="flex items-center gap-3">
        <input
          type="date"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          value={valeur}
          onChange={e => { setValeur(e.target.value); onSave({ conforme: new Date(e.target.value) > new Date(), valeur_date: e.target.value }); }}
        />
        {valeur !== '' && (
          conforme ? <CheckCircle2 className="text-green-500" size={24} /> : <X className="text-red-500" size={24} />
        )}
      </div>
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
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v));
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
        {execution.items.map(item => {
          const props = { key: item.id, item, resultat: item.resultat, onSave: (values, photo) => saveItem(item.id, values, photo) };
          if (item.type === 'binaire') return <ItemBinaire {...props} />;
          if (item.type === 'quantite') return <ItemQuantite {...props} />;
          if (item.type === 'temperature') return <ItemTemperature {...props} />;
          if (item.type === 'peremption') return <ItemPeremption {...props} />;
          return null;
        })}
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
