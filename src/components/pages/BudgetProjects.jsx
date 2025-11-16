import React, { useEffect, useMemo, useState } from "react";
import { budgetAPI } from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value || 0);

const BudgetProjects = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    allocated_amount: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await budgetAPI.list();
      setBudgets(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les budgets pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const summary = useMemo(() => {
    const allocated = budgets.reduce(
      (acc, item) => acc + Number(item.allocated_amount || 0),
      0
    );
    const committed = budgets.reduce(
      (acc, item) => acc + Number(item.committed_amount || 0),
      0
    );
    const spent = budgets.reduce(
      (acc, item) => acc + Number(item.spent_amount || 0),
      0
    );
    const available = budgets.reduce(
      (acc, item) => acc + Number(item.available_amount || 0),
      0
    );
    return { allocated, committed, spent, available };
  }, [budgets]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Nom et code sont obligatoires.");
      return;
    }
    if (!formData.allocated_amount) {
      toast.error("Merci d'indiquer le montant alloué.");
      return;
    }
    setSaving(true);
    try {
      await budgetAPI.create({
        ...formData,
        allocated_amount: parseFloat(formData.allocated_amount),
      });
      toast.success("Projet budgétaire créé.");
      setFormData({
        name: "",
        code: "",
        allocated_amount: "",
        description: "",
        start_date: "",
        end_date: "",
      });
      fetchBudgets();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.detail ||
        "Création impossible. Vérifiez les informations.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (project, status) => {
    try {
      await budgetAPI.update(project.id, { status });
      toast.success("Budget mis à jour.");
      fetchBudgets();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier ce budget.");
    }
  };

  const getStatusBadge = (status) => {
    const mapping = {
      active: { label: "Actif", classes: "bg-green-100 text-green-700" },
      on_hold: { label: "Suspendu", classes: "bg-yellow-100 text-yellow-700" },
      closed: { label: "Clôturé", classes: "bg-gray-200 text-gray-700" },
    };
    return mapping[status] || mapping.active;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Budget comptabilité
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Pilotage des enveloppes financières
          </h1>
          <p className="text-gray-600 mt-1">
            Créez vos projets budgétaires, suivez les montants engagés et leur
            consommation à l’euro près.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Budget alloué</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(summary.allocated)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Engagé</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(summary.committed)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Consommé</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(summary.spent)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Disponible</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(summary.available)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Projets budgétaires
            </h2>
            <span className="text-sm text-gray-500">
              {budgets.length} projet(s)
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
              Aucun budget défini pour l’instant.
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const badge = getStatusBadge(budget.status);
                const engaged =
                  Number(budget.committed_amount || 0) +
                  Number(budget.spent_amount || 0);
                const ratio =
                  budget.allocated_amount > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (engaged / Number(budget.allocated_amount || 1)) * 100
                        )
                      )
                    : 0;
                return (
                  <div
                    key={budget.id}
                    className="border border-gray-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {budget.code}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {budget.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {budget.description || "Pas de description"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Alloué</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(budget.allocated_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Engagé</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(engaged)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Disponible</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(budget.available_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Consommé</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(budget.spent_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progression</span>
                        <span>{ratio}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${ratio}%` }}
                        ></div>
                      </div>
                    </div>

                    {user?.role === "accounting" && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {budget.status !== "closed" && (
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleStatusChange(budget, "closed")}
                          >
                            Clôturer
                          </button>
                        )}
                        {budget.status === "active" && (
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => handleStatusChange(budget, "on_hold")}
                          >
                            Suspendre
                          </button>
                        )}
                        {budget.status !== "active" && (
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(budget, "active")}
                          >
                            Réactiver
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Nouveau projet
              </h2>
              <p className="text-sm text-gray-500">
                Segmentez vos enveloppes pour mieux suivre les engagements.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleCreateProject}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ex : Projet Campus Digital"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500 uppercase"
                placeholder="Ex : CAMPUS-2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant alloué (XOF) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                name="allocated_amount"
                value={formData.allocated_amount}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="5000000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Objectif, périmètre, contraintes..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Début (optionnel)
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin (optionnel)
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le projet
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default BudgetProjects;
