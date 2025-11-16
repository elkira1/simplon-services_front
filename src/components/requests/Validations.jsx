import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { requestsAPI } from "../../services/api";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  Eye,
  Search,
  User,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { getRequestStatusConfig } from "../../utils/requestStatus";

const Validations = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    search: "",
    urgency: "all",
  });

  // Debounce pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const statusForRole = React.useMemo(() => {
    if (user?.role === "mg") return "pending";
    if (user?.role === "accounting") return "mg_approved";
    if (user?.role === "director") return "accounting_reviewed";
    return "";
  }, [user?.role]);

  const getWaitingDays = (request) => {
    const created = new Date(request.created_at);
    const diff = Date.now() - created.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getAmountValue = (request) => {
    if (request.final_cost != null) return Number(request.final_cost);
    if (request.estimated_cost != null) return Number(request.estimated_cost);
    return 0;
  };

  const formatAsCurrency = (value) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(value || 0);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getRequests({
        status: statusForRole,
        search: filters.search,
        urgency:
          filters.urgency !== "all" && filters.urgency !== "urgent"
            ? filters.urgency
            : undefined,
        pageSize: 50,
        ordering: "created_at",
      });
      let filteredRequests = response.data.results || response.data;

      if (filters.urgency === "urgent") {
        filteredRequests = filteredRequests.filter(
          (req) => req.urgency === "high" || req.urgency === "critical"
        );
      }

      setRequests(filteredRequests);
    } catch (error) {
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.urgency, statusForRole]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const getValidationTitle = () => {
    const titles = {
      mg: "Validations - Moyens Généraux",
      accounting: "Validations - Comptabilité",
      director: "Validations - Direction",
    };
    return titles[user?.role] || "Validations";
  };

  const getValidationDescription = () => {
    const descriptions = {
      mg: "Demandes en attente de validation technique",
      accounting: "Demandes en attente d'étude comptable",
      director: "Demandes en attente d'approbation finale",
    };
    return descriptions[user?.role] || "";
  };

  const getUrgencyConfig = (urgency) => {
    const configs = {
      low: {
        class: "bg-green-100 text-green-800",
        text: "Faible",
        icon: CheckCircle,
        dotClass: "bg-green-400",
      },
      medium: {
        class: "bg-yellow-100 text-yellow-800",
        text: "Moyenne",
        icon: Clock,
        dotClass: "bg-yellow-400",
      },
      high: {
        class: "bg-orange-100 text-orange-800",
        text: "Élevée",
        icon: AlertTriangle,
        dotClass: "bg-orange-400",
      },
      critical: {
        class: "bg-red-100 text-red-800",
        text: "Critique",
        icon: AlertTriangle,
        dotClass: "bg-red-400",
      },
    };
    return (
      configs[urgency] || {
        class: "bg-gray-100 text-gray-800",
        text: urgency || "Non défini",
        icon: Clock,
        dotClass: "bg-gray-400",
      }
    );
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedRequests = React.useMemo(() => {
    let sortableRequests = [...requests];
    if (sortConfig.key) {
      sortableRequests.sort((a, b) => {
        if (sortConfig.key === "estimated_cost") {
          const aValue = a[sortConfig.key] || 0;
          const bValue = b[sortConfig.key] || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        if (sortConfig.key === "created_at") {
          const aValue = new Date(a[sortConfig.key]);
          const bValue = new Date(b[sortConfig.key]);
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        if (sortConfig.key === "urgency") {
          const urgencyOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          const aValue = urgencyOrder[a[sortConfig.key]] || 0;
          const bValue = urgencyOrder[b[sortConfig.key]] || 0;
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRequests;
  }, [requests, sortConfig]);

  const workflowMetrics = React.useMemo(() => {
    if (!["accounting", "mg"].includes(user?.role)) return null;

    const waiting = requests.length;
    const urgent = requests.filter((req) =>
      ["high", "critical"].includes(req.urgency)
    ).length;
    const totalAmount = requests.reduce(
      (sum, req) => sum + getAmountValue(req),
      0
    );
    const avgWait = waiting
      ? Math.round(
          requests.reduce((sum, req) => sum + getWaitingDays(req), 0) /
            waiting
        )
      : 0;

    return { waiting, urgent, totalAmount, avgWait };
  }, [requests, user?.role]);

  const priorityRequests = React.useMemo(() => {
    return sortedRequests
      .filter((req) => ["high", "critical"].includes(req.urgency))
      .slice(0, 4);
  }, [sortedRequests]);

  const SortableHeader = ({ column, children, className = "" }) => (
    <th
      className={`px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span className="truncate">{children}</span>
        <div className="flex flex-col flex-shrink-0">
          <ChevronUp
            className={`h-3 w-3 ${
              sortConfig.key === column && sortConfig.direction === "asc"
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 ${
              sortConfig.key === column && sortConfig.direction === "desc"
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          />
        </div>
      </div>
    </th>
  );

  // Composant pour l'affichage mobile en cartes
  const MobileValidationCard = ({ request }) => {
    const statusConfig = getRequestStatusConfig(request.status);
    const urgencyConfig = getUrgencyConfig(request.urgency);
    const StatusIcon = statusConfig.icon;
    const UrgencyIcon = urgencyConfig.icon;

    const daysSinceCreation = getWaitingDays(request);
    const amountFormatted = formatAsCurrency(getAmountValue(request));

    return (
      <div className="bg-white  rounded-lg p-4 shadow-sm ">
        {/* Badge action requise */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Action requise
          </span>
          {daysSinceCreation > 3 && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
              En retard ({daysSinceCreation}j)
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {request.item_description}
            </h3>
            {request.justification && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {request.justification}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {request.department && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                  {request.department}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-xs text-blue-700 font-semibold">
                {amountFormatted}
              </span>
            </div>
          </div>

          {/* Informations en grille */}
          <div className="grid grid-cols-2 gap-3">
            {/* Demandeur */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Demandeur</div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                  <User className="h-3 w-3 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {request.user_name || "N/A"}
                </span>
              </div>
            </div>

            {/* Montant */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Montant</div>
              <div className="text-sm font-semibold text-gray-900">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                }).format(
                  request.final_cost != null
                    ? request.final_cost
                    : request.estimated_cost || 0
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Date</div>
              <div className="text-sm text-gray-900">
                {new Date(request.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-gray-500">
                {daysSinceCreation} j d'attente
              </div>
            </div>

            {/* Statut */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Statut</div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${statusConfig.dotClassName}`}
                ></div>
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Urgence */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Urgence</div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${urgencyConfig.dotClass}`}
                ></div>
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.class}`}
                >
                  <UrgencyIcon className="w-3 h-3 mr-1" />
                  {urgencyConfig.text}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 border-t border-gray-100">
            <Link
              to={`/requests/${request.id}`}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Traiter la demande
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculer les stats pour le header
  const highRequestsCount = requests.filter(
    (req) => req.urgency === "high"
    // || req.urgency === "critical"
  ).length;

  const criticalRequestsCount = requests.filter(
    (req) => req.urgency === "critical"
  ).length;

  const oldRequestsCount = requests.filter((req) => {
    const daysSinceCreation = Math.floor(
      (new Date() - new Date(req.created_at)) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation > 3;
  }).length;

  const renderTableSection = () => (
    <div className="space-y-6">
      {sortedRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande à valider
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto px-4">
              Toutes les demandes ont été traitées ou aucune ne correspond à vos
              critères de recherche.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader column="item_description">
                      Description
                    </SortableHeader>
                    <SortableHeader column="user_name">
                      Demandeur
                    </SortableHeader>
                    <SortableHeader column="estimated_cost">
                      Montant
                    </SortableHeader>
                    <SortableHeader column="urgency">Urgence</SortableHeader>
                    <SortableHeader column="created_at">Date</SortableHeader>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRequests.map((request, index) => {
                    const statusConfig = getRequestStatusConfig(request.status);
                    const urgencyConfig = getUrgencyConfig(request.urgency);
                    const StatusIcon = statusConfig.icon;
                    const UrgencyIcon = urgencyConfig.icon;
                    const daysSinceCreation = getWaitingDays(request);

                    return (
                      <tr
                        key={request.id}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 max-w-xs line-clamp-2">
                              {request.item_description}
                            </div>
                            {request.justification && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">
                                {request.justification}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {request.user_name || "N/A"}
                              </div>
                              {request.department && (
                                <div className="text-xs text-gray-500">
                                  {request.department}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatAsCurrency(getAmountValue(request))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {request.budget_project?.code ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {request.budget_project.code}
                              </span>
                            ) : (
                              <span className="text-orange-600">Projet non affecté</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${urgencyConfig.dotClass}`}></div>
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.class}`}
                            >
                              <UrgencyIcon className="w-3 h-3 mr-1" />
                              {urgencyConfig.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(request.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {daysSinceCreation} j d'attente
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusConfig.className}`}>
                              <StatusIcon className="h-4 w-4 mr-1" />
                              {statusConfig.label}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock className="h-4 w-4 mr-1" />
                              {daysSinceCreation} j
                            </span>
                            <Link
                              to={`/requests/${request.id}`}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Traiter
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {sortedRequests.map((request) => (
              <MobileValidationCard key={request.id} request={request} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const isAccounting = user?.role === "accounting";
  const hasAdvancedLayout = ["accounting", "mg"].includes(user?.role);

  const sidebarSection = () => {
    if (!hasAdvancedLayout || !workflowMetrics) return null;
    const primaryCardTitle = isAccounting
      ? "Flux comptable"
      : "Budget estimé à valider";
    const primarySubtitle = isAccounting
      ? "Focus sur les demandes en cours"
      : "Total des dossiers en file cette semaine.";
    return (
      <aside className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {primaryCardTitle}
          </h3>
          <p className="text-xs text-gray-500 mb-3">{primarySubtitle}</p>
          {isAccounting ? (
            <>
              <p className="text-lg font-bold text-gray-900">
                {workflowMetrics.waiting} dossier
                {workflowMetrics.waiting !== 1 ? "s" : ""} en file
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Moyenne attente : {workflowMetrics.avgWait} j
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">
                {formatAsCurrency(workflowMetrics.totalAmount)}
              </p>
              <p className="text-xs text-gray-500">
                Montant mensuel : {formatAsCurrency(workflowMetrics.monthAmount || 0)}
              </p>
            </>
          )}
          <Link
            to="/budgets/statistics"
            className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Voir les statistiques
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Raccourcis
          </h3>
          <div className="space-y-2 text-sm">
            <Link to="/requests" className="block text-blue-600 hover:underline">
              Toutes les demandes
            </Link>
            <Link to="/budgets" className="block text-blue-600 hover:underline">
              Gérer les budgets
            </Link>
            <Link to="/budgets/statistics" className="block text-blue-600 hover:underline">
              Exporter les chiffres
            </Link>
          </div>
        </div>
      </aside>
    );
  };

  const renderMetricCards = () => {
    if (!workflowMetrics) return null;
    const cards = [
      {
        label: "Dossiers en file",
        value: workflowMetrics.waiting,
        tone: "text-blue-600",
        sub: "à analyser",
      },
      {
        label: "Urgences",
        value: workflowMetrics.urgent,
        tone: "text-orange-600",
        sub: "high + critical",
      },
      !isAccounting && {
        label: "Montant estimé",
        value: formatAsCurrency(workflowMetrics.totalAmount),
        tone: "text-emerald-600",
        sub: "budget à engager",
      },
      isAccounting && {
        label: "Demandes attribuées",
        value: workflowMetrics.waiting_assigned || workflowMetrics.waiting,
        tone: "text-emerald-600",
        sub: "en cours de revue comptable",
      },
      {
        label: "Attente moyenne",
        value: `${workflowMetrics.avgWait} j`,
        tone: "text-gray-700",
        sub: "depuis la soumission",
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.filter(Boolean).map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.tone}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderPrioritySection = () => {
    if (!hasAdvancedLayout || priorityRequests.length === 0) return null;
    const priorityTitle = isAccounting
      ? "Urgences budgétaires"
      : "Demandes critiques";
    const priorityLabel = isAccounting
      ? "À traiter en priorité"
      : "Suivi prioritaire";
    return (
      <div className="bg-white border border-orange-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">
              {priorityLabel} ({priorityRequests.length})
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              {priorityTitle}
            </h3>
          </div>
          <Link
            to="/requests"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {priorityRequests.map((request) => (
            <div
              key={`priority-${request.id}`}
              className="border border-orange-100 rounded-xl p-3 bg-orange-50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {request.item_description}
                </p>
                <span className="text-xs text-orange-700">
                  {getWaitingDays(request)} j
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {request.user_name} • {request.department || "Département inconnu"}
              </p>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="font-semibold text-gray-900">
                  {formatAsCurrency(getAmountValue(request))}
                </span>
                <Link
                  to={`/requests/${request.id}`}
                  className={`text-xs font-semibold hover:underline ${
                    isAccounting ? "text-red-700" : "text-blue-700"
                  }`}
                >
                  Traiter maintenant
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMainColumn = () => (
    <div className="space-y-6">
      {renderMetricCards()}
      {renderPrioritySection()}
      {renderTableSection()}
    </div>
  );

  const sidebarContent = sidebarSection();
  const shouldUseAdvancedLayout = Boolean(sidebarContent && hasAdvancedLayout);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {getValidationTitle()}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {getValidationDescription()}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-500">
              {sortedRequests.length} demande
              {sortedRequests.length !== 1 ? "s" : ""} en attente :
            </span>
            {highRequestsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highRequestsCount} élevée
                {highRequestsCount !== 1 ? "s" : ""}
              </span>
            )}
            {criticalRequestsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalRequestsCount} critique
                {criticalRequestsCount !== 1 ? "s" : ""}
              </span>
            )}
            {oldRequestsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Clock className="h-3 w-3 mr-1" />
                {oldRequestsCount} en retard
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre urgence */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filters.urgency}
                onChange={(e) => handleFilterChange("urgency", e.target.value)}
                className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Toutes les urgences</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
                <option value="urgent">Élevée + Critique</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {shouldUseAdvancedLayout ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          {renderMainColumn()}
          {sidebarContent}
        </div>
      ) : (
        renderMainColumn()
      )}
    </div>
  );
};

export default Validations;
