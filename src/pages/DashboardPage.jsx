import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, AlertTriangle, Settings, LogOut } from 'lucide-react';

const STATUT_CONFIG = {
  a_faire: { label: 'À faire', color: 'bg-gray-100 text-gray-600', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Clock },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  manquee: { label: 'Manquée', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/executions/du-jour')
      .then(({ data }) => setExecutions(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const isLate = (exec) => {
    if (!exec.heure_limite || exec.statut === 'terminee') return false;
    const now = new Date();
    const [h, m] = exec.heure_limite.split(':');
    const limite = new Date();
    limite.setHours(parseInt(h), parseInt(m), 0);
    return now > limite;
  };

  const enAttente = executions.filter(e => e.statut !== 'terminee');
  const terminees = executions.filter(e => e.statut === 'terminee');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 shadow-md" style={{ background: 'linear-gradient(135deg, #3A2020, #4A2C2A)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="text-white font-bold text-sm">Mes Vérifs</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-white hover:bg-white/10">
                <Settings size={18} />
              </button>
            )}
            <a href="/" className="p-2 rounded-lg text-white hover:bg-white/10 inline-flex">
              <LogOut size={18} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Aujourd'hui</h1>
          <p className="text-sm text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : (
          <>
            {enAttente.length === 0 && terminees.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>Aucune vérification prévue aujourd'hui</p>
              </div>
            )}

            {enAttente.length > 0 && (
              <div className="space-y-3 mb-6">
                {enAttente.map(exec => {
                  const late = isLate(exec);
                  const config = late ? { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertTriangle } : STATUT_CONFIG[exec.statut];
                  const Icon = config.icon;
                  return (
                    <button
                      key={exec.id}
                      onClick={() => navigate(`/execution/${exec.id}`)}
                      className="w-full bg-white rounded-xl p-4 text-left shadow-sm border-2 border-transparent hover:border-yellow-600 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{exec.modele_nom}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {exec.heure_limite ? `À faire avant ${exec.heure_limite}` : 'À faire'}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${config.color}`}>
                        <Icon size={13} /> {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {terminees.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Terminées</p>
                <div className="space-y-2">
                  {terminees.map(exec => (
                    <div key={exec.id} className="bg-white rounded-xl p-3 flex items-center justify-between opacity-70">
                      <span className="text-sm text-gray-700">{exec.modele_nom}</span>
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
