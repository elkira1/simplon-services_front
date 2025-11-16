import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { provisionAPI } from "../../services/api";
import { toast } from "react-toastify";
import {
  Package,
  ClipboardCheck,
  Loader2,
  Calendar,
  AlertTriangle,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: "En attente",
    classes: "bg-yellow-100 text-yellow-800",
  },
  in_progress: {
    label: "En cours",
    classes: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Distribuée",
    classes: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Refusée",
    classes: "bg-red-100 text-red-700",
  },
};

const priorityConfig = {
  low: { label: "Basse", classes: "text-gray-600" },
  normal: { label: "Normale", classes: "text-blue-700" },
  high: { label: "Haute", classes: "text-red-700 font-semibold" },
};

const ProvisionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [scope, setScope] = useState(user?.role === "mg" ? "all" : "mine");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    expected_date: "",
  });

  const canManage = user?.role === "mg";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (scope === "mine") {
        params.scope = "mine";
      }
      const { data } = await provisionAPI.list(params);
      setRequests(data.results || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error(error);
      toast.error(
        "Impossible de charger les mises à disposition pour le moment."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await provisionAPI.create(formData);
      toast.success("Demande enregistrée, un responsable va l'examiner.");
      setFormData({
        title: "",
        description: "",
        priority: "normal",
        expected_date: "",
      });
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error("Création impossible. Vérifiez le formulaire.");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (requestId, payload) => {
    setUpdatingId(requestId);
    try {
      const body = { ...payload };
      if (body.status === "rejected" && !body.rejection_reason) {
        const reason = window.prompt("Merci de préciser la raison du refus :");
        if (!reason) {
          setUpdatingId(null);
          toast.info("Refus annulé : aucun motif fourni.");
          return;
        }
        body.rejection_reason = reason;
      }
      await provisionAPI.update(requestId, body);
      toast.success("Mise à jour enregistrée.");
      fetchRequests();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.detail ||
        "Impossible de mettre à jour cette demande.";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: "pending", label: "En attente" },
      { value: "in_progress", label: "En traitement" },
      { value: "completed", label: "Distribuée" },
      { value: "rejected", label: "Refusée" },
    ],
    []
  );

  const renderStats = () => {
    if (!stats) return null;
    const entries = [
      { key: "total", label: "Total", icon: Package, color: "text-gray-700" },
      {
        key: "pending",
        label: "En attente",
        icon: AlertTriangle,
        color: "text-yellow-600",
      },
      {
        key: "in_progress",
        label: "En cours",
        icon: Loader2,
        color: "text-blue-600",
      },
      {
        key: "completed",
        label: "Distribuées",
        icon: ClipboardCheck,
        color: "text-green-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {entries.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm"
          >
            <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats[key] || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRequestCard = (request) => {
    const statusInfo = statusConfig[request.status];
    const priorityInfo = priorityConfig[request.priority] || priorityConfig.normal;

    return (
      <div
        key={request.id}
        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {request.title}
            </h3>
            <p className="text-sm text-gray-500">
              Par {request.created_by_name} •{" "}
              {priorityInfo && (
                <span className={priorityInfo.classes}>
                  Priorité {priorityInfo.label}
                </span>
              )}
            </p>
          </div>
          {statusInfo && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.classes}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>

        <p className="mt-3 text-gray-700 whitespace-pre-line">
          {request.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {request.expected_date && (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Besoin avant le {new Date(request.expected_date).toLocaleDateString()}
            </span>
          )}
          <span>
            Créée le {new Date(request.created_at).toLocaleDateString()}
          </span>
          {request.handled_by_name && (
            <span>Géré par {request.handled_by_name}</span>
          )}
        </div>

        {request.manager_note && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Note du responsable</p>
            <p>{request.manager_note}</p>
          </div>
        )}

        {request.rejection_reason && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800">
            <p className="font-medium mb-1">Raison du refus</p>
            <p>{request.rejection_reason}</p>
          </div>
        )}

        {canManage && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <select
                className="border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 w-full md:w-1/3"
                value={request.status}
                onChange={(e) =>
                  handleStatusChange(request.id, { status: e.target.value })
                }
                disabled={updatingId === request.id}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <textarea
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                rows={2}
                placeholder="Note interne (visible dans l'historique)"
                defaultValue={request.manager_note}
                onBlur={(e) =>
                  e.target.value !== request.manager_note &&
                  handleStatusChange(request.id, { manager_note: e.target.value })
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Mise à disposition
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Demandes de matériel et ressources
          </h1>
          <p className="text-gray-600 mt-1">
            Tous les collaborateurs peuvent formuler un besoin. Les responsables
            Moyens Généraux suivent et distribuent.
          </p>
        </div>
        {canManage && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-500">Vue actuelle</p>
            <select
              className="mt-1 border-none focus:ring-0 text-gray-900 font-medium"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="all">Toutes les demandes</option>
              <option value="mine">Mes demandes personnelles</option>
            </select>
          </div>
        )}
      </header>

      {renderStats()}

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Nouvelle demande
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Décrivez précisément votre besoin. Le responsable Moyens Généraux
            vous répondra dès que possible.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ex: PC portable pour nouvelle recrue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description détaillée *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Précisez le contexte, la quantité, les contraintes..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expected_date: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Soumettre la demande
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600">Filtrer par statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Distribuées</option>
                <option value="rejected">Refusées</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">
              {requests.length} demande(s) dans cette vue
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              Aucune demande trouvée pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => renderRequestCard(request))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProvisionRequests;
