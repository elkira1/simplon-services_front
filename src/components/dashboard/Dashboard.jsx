import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI } from "../../services/api";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Copy,
  Users,
  Activity as ActivityIcon,
  Timer,
} from "lucide-react";
import { toast } from "react-toastify";

const StatCard = ({ icon: Icon, name, value, description, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white/90 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="p-5 flex items-center gap-4">
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="truncate">
        <p className="text-sm text-gray-500">{name}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, description, children, action }) => (
  <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const QueueItem = ({ item }) => {
  const handleCopy = () => {
    if (!item.item_description) return;
    navigator.clipboard?.writeText(item.item_description);
    toast.success("Description copiée dans le presse-papiers");
  };

  const actors = [
    { label: "MG", data: item.actors?.mg },
    { label: "Comptabilité", data: item.actors?.accounting },
    { label: "Direction", data: item.actors?.director },
  ];

  return (
    <div className="py-4 border-b last:border-b-0 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 break-words">
            {item.item_description}
          </p>
          <p className="text-xs text-gray-500">
            {item.requested_by?.name || "Demandeur inconnu"} ·{" "}
            {item.requested_by?.department || "Département non renseigné"}
          </p>
          <p className="text-xs text-gray-400">
            En attente depuis {item.waiting_days} jour
            {item.waiting_days > 1 ? "s" : ""} · Urgence{" "}
            {item.urgency_display}
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {item.current_step}
        </span>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-700 break-words">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Contenu de la demande</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Copy className="h-3 w-3" />
            Copier
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words text-gray-800 text-sm font-medium">
          {item.item_description}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
        {actors.map(
          ({ label, data }) =>
            (data?.name || label === "MG") && (
              <div
                key={label}
                className="rounded-lg border border-gray-100 bg-white px-3 py-2"
              >
                <p className="font-semibold text-gray-900">{label}</p>
                {data ? (
                  <>
                    <p>{data.name}</p>
                    {data.performed_at && (
                      <p className="text-[11px] text-gray-400">
                        {new Date(data.performed_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">En attente</p>
                )}
              </div>
            )
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <div>
          Dernière action :{" "}
          {item.last_action
            ? `${item.last_action.action_display} par ${
                item.last_action.performed_by?.name || "N/A"
              }`
            : "Aucune"}
        </div>
        <Link
          to={`/requests/${item.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
        >
          Ouvrir la demande
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

const RecentActionItem = ({ action }) => (
  <div className="py-3 border-b last:border-b-0">
    <div className="flex items-center justify-between text-sm">
      <p className="font-medium text-gray-900 inline-flex items-center gap-2">
        <ActivityIcon className="h-4 w-4 text-blue-500" />
        {action.action_display}
      </p>
      <span className="text-xs text-gray-400">
        {new Date(action.performed_at).toLocaleString("fr-FR")}
      </span>
    </div>
    <p className="text-sm text-gray-600">{action.request_description}</p>
    <p className="text-xs text-gray-400">
      Statut actuel : {action.request_status_display}
    </p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardAPI.getDashboard();
        setDashboardData(response.data);
      } catch (error) {
        toast.error("Erreur lors du chargement du dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const overview = dashboardData?.overview || {};
  const queueItems = dashboardData?.queue || [];
  const recentActions = dashboardData?.recent_actions || [];
  const teamActivity = dashboardData?.team_activity || {};
  const performance = dashboardData?.performance || {};
  const budgetBlock = dashboardData?.budget || {};
  const queueInsights = dashboardData?.queue_insights || {};

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const statCards = useMemo(() => {
    if (!dashboardData) return [];
    const base = {
      employee: [
        {
          name: "Mes demandes",
          value: overview?.owned_requests ?? 0,
          icon: FileText,
          color: "bg-blue-500",
          description: "Soumises par moi",
        },
        {
          name: "En attente de réponse",
          value: overview?.awaiting_feedback ?? 0,
          icon: Clock,
          color: "bg-yellow-500",
          description: "Toujours en cours",
        },
        {
          name: "Approuvées",
          value: overview?.approved_owned ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          description: "Validées par la direction",
        },
        {
          name: "Refusées",
          value: overview?.rejected_owned ?? 0,
          icon: XCircle,
          color: "bg-red-500",
          description: "Demandes rejetées",
        },
      ],
      mg: [
        {
          name: "Demandes visibles",
          value: overview?.total_visible ?? dashboardData?.total_requests ?? 0,
          icon: FileText,
          color: "bg-sky-500",
          description: "Dans mon périmètre",
        },
        {
          name: "À traiter",
          value: overview?.awaiting_my_action ?? queueInsights.awaiting ?? 0,
          icon: RefreshCw,
          color: "bg-orange-500",
          description: "En attente d'action",
        },
        {
          name: "Validées par moi",
          value: overview?.validated_by_me ?? 0,
          icon: CheckCircle,
          color: "bg-emerald-500",
          description: "Décisions prises",
        },
        {
          name: "Refusées par moi",
          value: overview?.rejected_by_me ?? 0,
          icon: XCircle,
          color: "bg-rose-500",
          description: "Décisions négatives",
        },
      ],
      accounting: [
        {
          name: "Dossier suivis",
          value: overview?.total_visible ?? 0,
          icon: FileText,
          color: "bg-indigo-500",
          description: "Demandes reçues",
        },
        {
          name: "À vérifier",
          value: overview?.awaiting_my_action ?? queueInsights.awaiting ?? 0,
          icon: RefreshCw,
          color: "bg-orange-500",
          description: "Budget à confirmer",
        },
        {
          name: "Validations",
          value: overview?.validated_by_me ?? 0,
          icon: CheckCircle,
          color: "bg-green-500",
          description: "Conformité confirmée",
        },
        {
          name: "Rejets",
          value: overview?.rejected_by_me ?? 0,
          icon: XCircle,
          color: "bg-rose-500",
          description: "Demandes rejetées",
        },
      ],
      director: [
        {
          name: "Dossiers globaux",
          value: overview?.total_visible ?? dashboardData?.total_requests ?? 0,
          icon: FileText,
          color: "bg-violet-500",
          description: "Vue consolidée",
        },
        {
          name: "À signer",
          value: overview?.awaiting_my_action ?? queueInsights.awaiting ?? 0,
          icon: RefreshCw,
          color: "bg-orange-500",
          description: "En attente de décision",
        },
        {
          name: "Décisions prises",
          value: overview?.validated_by_me ?? 0,
          icon: CheckCircle,
          color: "bg-emerald-500",
          description: "Approbations finales",
        },
        {
          name: "Refus prononcés",
          value: overview?.rejected_by_me ?? 0,
          icon: XCircle,
          color: "bg-rose-500",
          description: "Dossiers refusés",
        },
      ],
    };

    const fallback = [
      {
        name: "Demandes",
        value: overview?.total_visible ?? dashboardData?.total_requests ?? 0,
        icon: FileText,
        color: "bg-blue-500",
        description: "Toutes les demandes",
      },
    ];

    return base[user?.role] || fallback;
  }, [dashboardData, overview, queueInsights.awaiting, user?.role]);

  const currentBudget =
    budgetBlock.current_total ??
    dashboardData?.current_period_stats?.total_amount ??
    0;
  const previousBudget =
    budgetBlock.previous_total ??
    dashboardData?.previous_period_stats?.total_amount ??
    0;
  const fallbackVariation = previousBudget
    ? ((currentBudget - previousBudget) / previousBudget) * 100
    : currentBudget > 0
    ? 100
    : 0;
  const budgetTrendDirection =
    budgetBlock.trend?.direction || (fallbackVariation >= 0 ? "up" : "down");
  const budgetTrendValue =
    budgetBlock.trend?.value ??
    Math.abs(fallbackVariation).toFixed(1);

  const quickActions = useMemo(() => {
    const actionsByRole = {
      employee: [
        {
          title: "Nouvelle demande",
          description: "Soumettre un besoin",
          to: "/requests/create",
          accent: "bg-blue-50 text-blue-600",
        },
        {
          title: "Mes demandes",
          description: "Suivi de l'avancement",
          to: "/requests",
          accent: "bg-green-50 text-green-600",
        },
      ],
      mg: [
        {
          title: "Validations",
          description: "Traiter les demandes reçues",
          to: "/validations",
          accent: "bg-orange-50 text-orange-600",
        },
        {
          title: "Toutes les demandes",
          description: "Vue d'ensemble",
          to: "/requests",
          accent: "bg-indigo-50 text-indigo-600",
        },
        {
          title: "Créer une demande",
          description: "Besoin urgent / personnel",
          to: "/requests/create",
          accent: "bg-blue-50 text-blue-600",
        },
      ],
    };
    return actionsByRole[user?.role] || actionsByRole.employee;
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-rose-50 to-white p-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between shadow-sm">
        <div>
          <p className="text-sm text-gray-500 uppercase">Tableau de bord</p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-1">
            Bonjour {user?.first_name || user?.username},
          </h1>
          <p className="text-gray-500">
            {user?.role === "mg"
              ? "Pilotage des demandes arrivées à votre niveau."
              : "Suivi complet de votre activité d’achat."}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Dernière mise à jour</p>
          <p className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.name}
            icon={stat.icon}
            name={stat.name}
            value={stat.value}
            description={stat.description}
            accent={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title={
            user?.role === "employee"
              ? "Suivi de mes demandes"
              : "À traiter en priorité"
          }
          description={
            queueItems.length > 0
              ? `${queueItems.length} demande${
                  queueItems.length > 1 ? "s" : ""
                } dans la file`
              : "Aucune demande en attente"
          }
          action={
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
              {queueInsights.oldest_waiting_days || 0} j max
            </span>
          }
        >
          {queueItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              Tout est traité pour le moment. Vous pouvez suivre les nouvelles
              demandes depuis la liste générale.
            </p>
          ) : (
            queueItems.map((item) => <QueueItem key={item.id} item={item} />)
          )}
        </SectionCard>
        <SectionCard
          title="Budget approuvé"
          description="Montant global validé sur la période courante"
          action={
            <span
              className={`inline-flex items-center text-sm font-semibold ${
                budgetTrendDirection === "up"
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {budgetTrendDirection === "up" ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {parseFloat(budgetTrendValue).toFixed(1)}%
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Budget validé</p>
              <p className="text-3xl font-semibold text-gray-900">
                {formatCurrency(currentBudget)}
              </p>
              <p className="text-xs text-gray-400">
                vs {formatCurrency(previousBudget)} la période précédente
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Demandes approuvées
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardData?.approved_requests || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Montant moyen
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(
                    currentBudget /
                      Math.max(1, dashboardData?.approved_requests || 1)
                  )}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Mes dernières actions"
          description="Historique récent (6 dernières opérations)"
          action={
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {recentActions.length} actions
            </span>
          }
        >
          {recentActions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune action récente. Les validations et rejets apparaîtront ici.
            </p>
          ) : (
            recentActions.map((action) => (
              <RecentActionItem key={action.id} action={action} />
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Performance & file d'attente"
          description="Vue synthétique de votre activité"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Demandes en file
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {performance.queue_size || 0}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Timer className="h-3 w-3" />
                +{performance.queue_oldest_waiting_days || 0} j max
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Temps moyen
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {performance.avg_handle_time_days || 0} j
              </p>
              <p className="text-xs text-gray-400">Entre réception et action</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Actions 30 derniers jours
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {performance.actions_last_30_days || 0}
              </p>
              <p className="text-xs text-gray-400">Validations ou rejets</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Activité des équipes"
        description="Vue consolidée par rôle"
        action={
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {Object.keys(teamActivity || {}).length} équipes suivies
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(teamActivity || {}).map(([roleKey, info]) => (
            <div
              key={roleKey}
              className="rounded-2xl border border-gray-100 p-4 bg-white shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <p className="font-semibold text-gray-900">{info.label}</p>
              </div>
              <p className="text-sm text-gray-600">
                {info.awaiting} en attente · {info.validated_today} traitées
                aujourd'hui
              </p>
              <p className="text-xs text-gray-400">
                {info.members} membre{info.members > 1 ? "s" : ""} actifs
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Actions rapides"
        description="Accès direct aux tâches fréquentes"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.to}
              className="rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{action.title}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center ${action.accent}`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      {user?.role === "employee" && dashboardData?.recent_requests && (
        <SectionCard
          title="Mes dernières demandes"
          description="Suivi en temps réel des statuts"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Montant</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.recent_requests.map((req) => (
                  <tr key={req.id} className="text-gray-700">
                    <td className="py-3">
                      <p className="font-medium">{req.item_description}</p>
                      <p className="text-xs text-gray-500">
                        Crée le{" "}
                        {new Date(req.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </td>
                    <td className="py-3 font-semibold">
                      {formatCurrency(req.estimated_cost || 0)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        {req.status_display || req.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/requests/${req.id}`}
                        className="text-blue-600 text-xs font-medium hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        Consulter
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default Dashboard;
