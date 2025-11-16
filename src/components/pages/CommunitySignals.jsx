import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { communityAPI } from "../../services/api";
import { toast } from "react-toastify";
import { Megaphone, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";

const categoryOptions = [
  { value: "logistics", label: "Logistique / Moyens" },
  { value: "it", label: "Informatique" },
  { value: "hr", label: "Ressources humaines" },
  { value: "security", label: "Sécurité" },
  { value: "other", label: "Autre" },
];

const statusStyles = {
  open: "bg-red-100 text-red-700",
  acknowledged: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

const CommunitySignals = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentLoading, setCommentLoading] = useState(null);
  const [newReport, setNewReport] = useState({
    title: "",
    category: "other",
    description: "",
  });

  const canModerate = ["mg", "director"].includes(user?.role);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await communityAPI.listReports();
      setReports(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les signalements communautaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCreateReport = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await communityAPI.createReport(newReport);
      toast.success("Merci, votre signalement est partagé à la communauté.");
      setNewReport({ title: "", category: "other", description: "" });
      loadReports();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'envoyer ce signalement.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddComment = async (reportId) => {
    const content = commentDrafts[reportId];
    if (!content || !content.trim()) return;
    setCommentLoading(reportId);
    try {
      await communityAPI.addComment(reportId, { content });
      setCommentDrafts((prev) => ({ ...prev, [reportId]: "" }));
      loadReports();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ajouter ce commentaire.");
    } finally {
      setCommentLoading(null);
    }
  };

  const handleStatusChange = async (reportId, status) => {
    if (!canModerate) return;
    try {
      await communityAPI.updateReport(reportId, { status });
      toast.success("Statut mis à jour.");
      loadReports();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.resolution_note ||
        error.response?.data?.detail ||
        "Impossible de modifier le statut.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Signalements & idées
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Espace communautaire
          </h1>
          <p className="text-gray-600 mt-1">
            Partagez les incidents, irritants ou améliorations. Toute
            l'organisation est informée et peut réagir.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Soumettre un signalement
              </h2>
              <p className="text-sm text-gray-500">
                Visible immédiatement par tous les collaborateurs.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={newReport.title}
                onChange={(e) =>
                  setNewReport((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ex: Climatisation défectueuse en salle B"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={newReport.category}
                onChange={(e) =>
                  setNewReport((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                value={newReport.description}
                onChange={(e) =>
                  setNewReport((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Décrivez précisément le problème ou l'amélioration souhaitée."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex justify-center items-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Publier le signalement
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              Aucun signalement pour le moment. Soyez le premier à partager une
              information.
            </div>
          ) : (
            reports.map((report) => {
              const statusStyle = statusStyles[report.status] || statusStyles.open;
              const comments = report.comments || [];
              return (
                <article
                  key={report.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {categoryOptions.find((o) => o.value === report.category)
                          ?.label || "Autre"}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Publié par {report.created_by_name} •{" "}
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${statusStyle}`}
                      >
                        {report.status_display}
                      </span>
                      {canModerate && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() =>
                              handleStatusChange(report.id, "acknowledged")
                            }
                          >
                            Prendre en charge
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() =>
                              handleStatusChange(report.id, "resolved")
                            }
                          >
                            Clore
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-line">
                    {report.description}
                  </p>

                  {report.resolution_note && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800 flex gap-2 items-start">
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="font-medium">Note de résolution</p>
                        <p>{report.resolution_note}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      <span>{comments.length} commentaire(s)</span>
                    </div>

                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                        >
                          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                            <span>{comment.author_name}</span>
                            <span>
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-800">{comment.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <textarea
                        rows={2}
                        placeholder="Ajouter un commentaire visible par tous..."
                        value={commentDrafts[report.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [report.id]: e.target.value,
                          }))
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(report.id)}
                        disabled={commentLoading === report.id}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                      >
                        {commentLoading === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          "Publier"
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default CommunitySignals;
