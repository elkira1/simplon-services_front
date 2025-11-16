import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { budgetAPI } from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  PieChart,
  BarChart2,
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value || 0);

const BudgetStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await budgetAPI.stats();
      setStats(data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Accès réservé au service comptabilité.");
      } else {
        toast.error("Impossible de récupérer les statistiques budgétaires.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const overview = stats?.totals || {};
  const monthlyHistory = stats?.monthly_history || [];
  const projects = stats?.projects || [];
  const topExpenses = stats?.top_expenses || [];
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchStatus =
        statusFilter === "all" || project.status === statusFilter;
      const matchTerm =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.code.toLowerCase().includes(term);
      return matchStatus && matchTerm;
    });
  }, [projects, statusFilter, searchTerm]);

  const maxMonthly = useMemo(() => {
    return monthlyHistory.reduce(
      (max, item) => Math.max(max, Number(item.amount || 0)),
      0
    );
  }, [monthlyHistory]);

  const allocationSegments = useMemo(() => {
    const allocated = Number(overview.allocated || 0);
    if (!allocated) {
      return [{ label: "Alloué", value: 1, color: "#e5e7eb" }];
    }
    return [
      {
        label: "Consommé",
        value: Number(overview.spent || 0),
        color: "#ef4444",
      },
      {
        label: "Engagé",
        value: Number(overview.committed || 0),
        color: "#facc15",
      },
      {
        label: "Disponible",
        value: Number(overview.available || 0),
        color: "#10b981",
      },
    ];
  }, [overview]);

  const donutGradient = useMemo(() => {
    const total = allocationSegments.reduce((sum, seg) => sum + seg.value, 0);
    if (!total) return "#e5e7eb";
    let current = 0;
    return allocationSegments
      .map((seg) => {
        const start = (current / total) * 100;
        current += seg.value;
        const end = (current / total) * 100;
        return `${seg.color} ${start}% ${end}%`;
      })
      .join(", ");
  }, [allocationSegments]);

  const lineChartPoints = useMemo(() => {
    if (!monthlyHistory.length) return "";
    const width = 480;
    const height = 160;
    const maxValue = maxMonthly || 1;
    return monthlyHistory
      .map((item, index) => {
        const x = (index / (monthlyHistory.length - 1 || 1)) * width;
        const value = Number(item.amount || 0);
        const y = height - (value / maxValue) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [monthlyHistory, maxMonthly]);

  const lowAvailabilityProjects = useMemo(
    () =>
      filteredProjects.filter(
        (project) =>
          Number(project.available || 0) <
          Number(project.allocated || 0) * 0.15
      ),
    [filteredProjects]
  );

  const handleExportCSV = () => {
    if (!filteredProjects.length) {
      toast.info("Aucun projet à exporter.");
      return;
    }
    const headers = [
      "Code",
      "Nom",
      "Statut",
      "Alloué",
      "Engagé",
      "Consommé",
      "Disponible",
    ];
    const rows = filteredProjects.map((project) => [
      project.code,
      project.name,
      project.status,
      project.allocated,
      project.committed,
      project.spent,
      project.available,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => (cell !== null && cell !== undefined ? cell : ""))
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "budgets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!filteredProjects.length) {
      toast.info("Aucun projet à exporter.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      filteredProjects.map((project) => ({
        Code: project.code,
        Nom: project.name,
        Statut: project.status,
        "Montant alloué": project.allocated,
        "Montant engagé": project.committed,
        "Montant consommé": project.spent,
        Disponible: project.available,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budgets");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "budgets.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Analyse budgétaire
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Vue d'ensemble des projets finances
          </h1>
          <p className="text-gray-600 mt-1">
            Suivez vos enveloppes, les montants engagés et les dépenses réellement
            consommées.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Budget alloué",
            value: formatCurrency(overview.allocated),
            icon: PieChart,
            tone: "text-indigo-600",
          },
          {
            label: "Montant engagé",
            value: formatCurrency(overview.committed),
            icon: TrendingUp,
            tone: "text-amber-600",
          },
          {
            label: "Montant consommé",
            value: formatCurrency(overview.spent),
            icon: TrendingDown,
            tone: "text-rose-600",
          },
          {
            label: "Disponible",
            value: formatCurrency(overview.available),
            icon: BarChart2,
            tone: "text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className={`p-3 rounded-xl bg-gray-50 ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Exporter les données
              </h2>
              <p className="text-sm text-gray-500">
                Téléchargez l'état des projets en CSV ou Excel.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 text-sm text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4" /> Excel
              </button>
            </div>
          </div>
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-600">
            Exportez l'ensemble des projets budgétaires, y compris les montants
            alloués, engagés, consommés et restants. Ces fichiers peuvent être
            importés dans vos outils comptables habituels.
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-gray-600 mb-3">
            Répartition globale
          </p>
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${donutGradient})`,
            }}
          >
            <div className="w-20 h-20 rounded-full bg-white text-center flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500">Utilisé</span>
              <span className="font-semibold text-gray-900">
                {overview.allocated
                  ? `${Math.round(
                      ((overview.spent || 0) / overview.allocated) * 100
                    )}%`
                  : "0%"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
            {allocationSegments.map((segment) => (
              <span
                key={segment.label}
                className="inline-flex items-center gap-1 text-gray-600"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></span>
                {segment.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Consommation mensuelle
              </h2>
              <p className="text-sm text-gray-500">
                Approbations direction sur les six derniers mois
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-full p-1 flex">
                {[
                  { value: "all", label: "Tous" },
                  { value: "active", label: "Actifs" },
                  { value: "on_hold", label: "Suspendus" },
                  { value: "closed", label: "Clôturés" },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      statusFilter === option.value
                        ? "bg-white shadow text-red-600"
                        : "text-gray-500"
                    }`}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un projet..."
                className="border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {monthlyHistory.length === 0 ? (
            <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-xl p-8">
              Pas encore de validation enregistrée.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-3 h-48">
                {monthlyHistory.map((item) => {
                  const ratio = maxMonthly
                    ? Number(item.amount || 0) / maxMonthly
                    : 0;
                  return (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                      <div className="flex-1 w-full bg-gray-100 rounded-full overflow-hidden flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-red-600 via-rose-500 to-orange-400 rounded-full transition-all"
                          style={{ height: `${Math.round(ratio * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {item.label}
                      </div>
                      <div className="text-xs font-semibold text-gray-700">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 480 160" className="w-full h-40">
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    points={lineChartPoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {monthlyHistory.map((item, index) => {
                    const x =
                      (index / (monthlyHistory.length - 1 || 1)) * 480;
                    const value = Number(item.amount || 0);
                    const y = maxMonthly
                      ? 160 - (value / maxMonthly) * 160
                      : 160;
                    return (
                      <g key={item.label}>
                        <circle cx={x} cy={y} r={4} fill="#ef4444" />
                        <text
                          x={x}
                          y={y - 8}
                          fontSize="10"
                          fill="#4b5563"
                          textAnchor="middle"
                        >
                          {formatCurrency(item.amount)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Plus grosses dépenses
              </h2>
              <p className="text-sm text-gray-500">
                Top 5 des demandes approuvées par la direction
              </p>
            </div>
          </div>

          {topExpenses.length === 0 ? (
            <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-xl p-6">
              Pas encore de dépenses validées.
            </div>
          ) : (
            <div className="space-y-3">
              {topExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.user}
                    </p>
                    <p className="text-xs text-gray-500">
                      Projet {expense.project || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.approved_at
                        ? new Date(expense.approved_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Projets budgétaires
          </h2>
          <span className="text-sm text-gray-500">
            {filteredProjects.length} projet(s)
          </span>
        </div>
        {lowAvailabilityProjects.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <div>
              {lowAvailabilityProjects.length} projet(s) ont moins de 15% de
              budget disponible. Pensez à les réapprovisionner.
            </div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-xl p-8">
            Aucun projet pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Projet",
                    "Alloué",
                    "Engagé",
                    "Consommé",
                    "Disponible",
                    "Progression",
                  ].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {project.code}
                        <ChevronRight className="h-3 w-3" />
                        <span className="capitalize">{project.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatCurrency(project.allocated)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatCurrency(project.committed)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatCurrency(project.spent)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatCurrency(project.available)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                            style={{ width: `${Math.min(100, project.progress)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(project.progress)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default BudgetStatistics;
