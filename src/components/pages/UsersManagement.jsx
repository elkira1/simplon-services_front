import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { usersAPI } from "../../services/api";
import { toast } from "react-toastify";

import {
  Users,
  Plus,
  UserPlus,
  Shield,
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Calendar,
  ChevronUp,
  ChevronDown,
  Clock,
  RefreshCw,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "employee", label: "Personnel" },
  { value: "mg", label: "Responsable Moyens Généraux" },
  { value: "accounting", label: "Comptabilité" },
  { value: "director", label: "Direction" },
];

const DEPARTMENT_OPTIONS = [
  "Service Développement",
  "Service Communication",
  "Service Pédagogique",
  "Service Moyens Généraux",
  "Service Insertion",
  "Administration",
  "Comptabilité",
  "Ressources Humaines",
  "IT/Informatique",
  "Commercial",
  "Production",
  "Logistique",
  "Marketing",
  "Autre",
];

const parseDepartments = (value = "") =>
  value
    .split("|")
    .map((dept) => dept.trim())
    .filter(Boolean);

// Composant AddUserForm intégré
const AddUserForm = ({ onClose, onUserAdded, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [customDepartment, setCustomDepartment] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "employee",
    department: "",
    phone: "",
  });

  const syncDepartmentField = (departments) => {
    setFormData((prev) => ({
      ...prev,
      department: departments.join(" | "),
    }));
  };

  const toggleDepartment = (dept) => {
    setSelectedDepartments((prev) => {
      const exists = prev.includes(dept);
      const updated = exists ? prev.filter((d) => d !== dept) : [...prev, dept];
      syncDepartmentField(updated);
      return updated;
    });
    if (error) setError("");
    if (success) setSuccess(null);
  };

  const handleDepartmentRemove = (dept) => {
    setSelectedDepartments((prev) => {
      const updated = prev.filter((d) => d !== dept);
      syncDepartmentField(updated);
      return updated;
    });
  };

  const handleCustomDepartmentAdd = () => {
    const value = customDepartment.trim();
    if (!value) return;
    setSelectedDepartments((prev) => {
      if (prev.includes(value)) return prev;
      const updated = [...prev, value];
      syncDepartmentField(updated);
      return updated;
    });
    setCustomDepartment("");
    if (error) setError("");
    if (success) setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess(null);
  };

  const handleSubmit = async () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.first_name ||
      !formData.last_name
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await usersAPI.createUser(formData);

      setSuccess({
        user: response.data,
        password: response.data.generated_password,
      });

      toast.success(`Utilisateur ${response.data.username} créé avec succès`);

      if (onUserAdded) {
        onUserAdded(response.data);
      }

      setSelectedDepartments([]);
      setCustomDepartment("");

      // Fermer le modal après 3 secondes
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la création:", err);

      let message = "Erreur lors de la création de l'utilisateur";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const errors = Object.values(data).flat();
          message = errors.join("\n");
        } else if (typeof data === "string") {
          message = data;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !["mg", "director"].includes(currentUser.role)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">
            Vous n'avez pas les droits pour créer des utilisateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Ajouter un nouvel utilisateur
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2" />
              <div className="flex-1">
                <h4 className="text-green-800 font-medium">
                  Utilisateur créé avec succès !
                </h4>
                <div className="mt-2 text-green-700">
                  <p>
                    <strong>Nom d'utilisateur:</strong> {success.user.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {success.user.email}
                  </p>
                  <p>
                    <strong>Mot de passe généré:</strong>
                    <span className="font-mono bg-green-100 px-2 py-1 rounded ml-1">
                      {success.password}
                    </span>
                  </p>
                  <p className="text-sm mt-2 text-green-600">
                    ⚠️ Le modal se fermera automatiquement dans quelques
                    secondes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nom.utilisateur"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@entreprise.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle *
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <div className="pl-10 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          selectedDepartments.includes(dept)
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium"
                        >
                          {dept}
                          <button
                            type="button"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => handleDepartmentRemove(dept)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomDepartmentAdd();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ajouter un service personnalisé"
                    />
                    <button
                      type="button"
                      onClick={handleCustomDepartmentAdd}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+225 XX XX XX XX XX"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Créé
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer l'utilisateur
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant modal pour éditer un utilisateur
const EditUserModal = ({ user, onClose, onUserUpdated, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: user?.role || "employee",
    department: user?.department || "",
    phone: user?.phone || "",
    is_active: user?.is_active !== undefined ? user.is_active : true,
  });
  const [selectedDepartments, setSelectedDepartments] = useState(
    parseDepartments(user?.department)
  );
  const [customDepartment, setCustomDepartment] = useState("");

  useEffect(() => {
    setFormData({
      role: user?.role || "employee",
      department: user?.department || "",
      phone: user?.phone || "",
      is_active: user?.is_active !== undefined ? user.is_active : true,
    });
    setSelectedDepartments(parseDepartments(user?.department));
  }, [user]);

  const syncDepartmentField = (departments) => {
    setFormData((prev) => ({
      ...prev,
      department: departments.join(" | "),
    }));
  };

  const toggleDepartment = (dept) => {
    setSelectedDepartments((prev) => {
      const exists = prev.includes(dept);
      const updated = exists ? prev.filter((d) => d !== dept) : [...prev, dept];
      syncDepartmentField(updated);
      return updated;
    });
  };

  const handleDepartmentRemove = (dept) => {
    setSelectedDepartments((prev) => {
      const updated = prev.filter((d) => d !== dept);
      syncDepartmentField(updated);
      return updated;
    });
  };

  const handleCustomDepartmentAdd = () => {
    const value = customDepartment.trim();
    if (!value) return;
    setSelectedDepartments((prev) => {
      if (prev.includes(value)) return prev;
      const updated = [...prev, value];
      syncDepartmentField(updated);
      return updated;
    });
    setCustomDepartment("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.updateUser(user.id, formData);
      toast.success("Utilisateur mis à jour avec succès");
      if (onUserUpdated) {
        onUserUpdated(response.data);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const canEditUser =
    currentUser && ["mg", "director"].includes(currentUser.role);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Modifier l'utilisateur
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Informations en lecture seule */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Informations personnelles (non modifiables)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nom d'utilisateur
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.username ? user.username : "Inconnu"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.email ? user.email : "Inconnu"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Prénom
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.first_name ? user.first_name : "Inconnu"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nom
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.last_name ? user.last_name : "Inconnu"}
              </p>
            </div>
            {user.role != "mg" && user.role != "director" ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Téléphone
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {user.phone ? user.phone : "Aucun numéro de téléphone"}
                </p>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Informations modifiables */}
        {canEditUser ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Informations administratives (modifiables)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Département
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          selectedDepartments.includes(dept)
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium"
                        >
                          {dept}
                          <button
                            type="button"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => handleDepartmentRemove(dept)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomDepartmentAdd();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Ajouter un service personnalisé"
                    />
                    <button
                      type="button"
                      onClick={handleCustomDepartmentAdd}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {user.role == "mg" || user.role == "director" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={user.phone ? user.phone : "+225 XXXXXXXXXX"}
                />
              </div>
            ) : (
              <div></div>
            )}

            {user.role != "mg" && user.role != "director" ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Compte actif
                </label>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-yellow-800">
                Vous n'avez pas les droits pour modifier les informations
                administratives.
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {canEditUser ? "Annuler" : "Fermer"}
          </button>
          {canEditUser && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Mettre à jour
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal de gestion des utilisateurs
const UsersManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    created_by: "all",
    is_active: "all",
  });

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = {
          page,
          search: filters.search,
          role: filters.role === "all" ? "" : filters.role,
          created_by: filters.created_by === "all" ? "" : filters.created_by,
          is_active: filters.is_active === "all" ? "" : filters.is_active,
        };

        const response = await usersAPI.getUsers(params);

        setUsers(response.data.users || []);
        setPagination(response.data.pagination || null);
        setStats(response.data.stats || null);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAdded = (newUser) => {
    fetchUsers();
    setShowAddForm(false);
  };

  const handleUserUpdated = (updatedUser) => {
    fetchUsers();
    setEditingUser(null);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getRoleConfig = (role) => {
    const configs = {
      employee: {
        class: "bg-gray-100 text-gray-800",
        text: "Personnel",
        dotClass: "bg-gray-400",
      },
      mg: {
        class: "bg-blue-100 text-blue-800",
        text: "Responsable Moyens Généraux",
        dotClass: "bg-blue-400",
      },
      accounting: {
        class: "bg-green-100 text-green-800",
        text: "Comptabilité",
        dotClass: "bg-green-400",
      },
      director: {
        class: "bg-purple-100 text-purple-800",
        text: "Direction",
        dotClass: "bg-purple-400",
      },
    };
    return (
      configs[role] || {
        class: "bg-gray-100 text-gray-800",
        text: role,
        dotClass: "bg-gray-400",
      }
    );
  };

  // Trier les utilisateurs côté client
  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (sortConfig.key === "created_at") {
          const aValue = new Date(a[sortConfig.key]);
          const bValue = new Date(b[sortConfig.key]);
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
    return sortableUsers;
  }, [users, sortConfig]);

  // Composant d'en-tête de tri
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
  const MobileUserCard = ({ user }) => {
    const roleConfig = getRoleConfig(user.role);

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="space-y-3">
          {/* Header avec nom et statut */}
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-medium text-sm">
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.class}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${roleConfig.dotClass}`}
                ></div>
                {roleConfig.text}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {user.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>

          {/* Informations */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-500 mb-1">Créé le</div>
              <div className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Créé par</div>
              <div className="text-gray-900">
                {user.created_by_name || "Système"}
                {user.created_by_role && (
                  <span className="text-xs text-gray-500 block">
                    ({user.created_by_role})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setEditingUser(user)}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Vérifier les permissions
  if (!user || !["mg", "director"].includes(user.role)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Accès restreint
              </h3>
              <p className="text-red-700 mt-1">
                Vous n'avez pas les droits nécessaires pour accéder à la gestion
                des utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gérer les comptes utilisateurs de l'organisation
          </p>
          {stats && (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-500">
                {stats.total_users} utilisateur
                {stats.total_users !== 1 ? "s" : ""} total
                {stats.users_created_by_me > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stats.users_created_by_me} créé
                    {stats.users_created_by_me !== 1 ? "s" : ""} par vous
                  </span>
                )}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.active_users} actif{stats.active_users !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total_users}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.active_users}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Créés par vous
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.users_created_by_me}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Cette semaine
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.users_created_last_7_days}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* Filtre rôle */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tous les rôles</option>
                <option value="employee">Personnel</option>
                <option value="mg">Responsable Moyens Généraux</option>
                <option value="accounting">Comptabilité</option>
                <option value="director">Direction</option>
              </select>
            </div>

            {/* Filtre créateur */}
            {stats?.filters?.creators && stats.filters.creators.length > 0 && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filters.created_by}
                  onChange={(e) =>
                    handleFilterChange("created_by", e.target.value)
                  }
                  className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Tous les créateurs</option>
                  {stats.filters.creators.map((creator) => (
                    <option key={creator.username} value={creator.username}>
                      {creator.first_name} {creator.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtre statut */}
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filters.is_active}
                onChange={(e) =>
                  handleFilterChange("is_active", e.target.value)
                }
                className="pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {sortedUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto px-4">
              Aucun utilisateur ne correspond à vos critères de recherche.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Affichage desktop - tableau */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader column="first_name">
                      Utilisateur
                    </SortableHeader>
                    <SortableHeader column="email">Email</SortableHeader>
                    <SortableHeader column="role">Rôle</SortableHeader>
                    <SortableHeader column="department">
                      Département
                    </SortableHeader>
                    <SortableHeader column="created_by_name">
                      Créé par
                    </SortableHeader>
                    <SortableHeader column="created_at">
                      Date création
                    </SortableHeader>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map((user) => {
                    const roleConfig = getRoleConfig(user.role);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        {/* Utilisateur */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.first_name?.[0]}
                                {user.last_name?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${roleConfig.dotClass}`}
                            ></div>
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.class}`}
                            >
                              {roleConfig.text}
                            </span>
                          </div>
                        </td>

                        {/* Département */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.department || "Non défini"}
                          </div>
                        </td>

                        {/* Créé par */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.created_by_name || "Système"}
                          </div>
                          {user.created_by_role && (
                            <div className="text-xs text-gray-500">
                              {user.created_by_role}
                            </div>
                          )}
                        </td>

                        {/* Date création */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.created_at).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.is_active ? "Actif" : "Inactif"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.current_page} sur {pagination.total_pages}(
                  {pagination.total_count} utilisateur
                  {pagination.total_count !== 1 ? "s" : ""})
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchUsers(pagination.current_page - 1)}
                    disabled={!pagination.has_previous}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Affichage mobile/tablette - cartes */}
          <div className="lg:hidden space-y-4">
            {sortedUsers.map((user) => (
              <MobileUserCard key={user.id} user={user} />
            ))}

            {/* Pagination mobile */}
            {pagination && pagination.total_pages > 1 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.current_page} / {pagination.total_pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchUsers(pagination.current_page - 1)}
                      disabled={!pagination.has_previous}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Préc.
                    </button>
                    <button
                      onClick={() => fetchUsers(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Suiv.
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal d'ajout d'utilisateur */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddUserForm
            currentUser={user}
            onClose={() => setShowAddForm(false)}
            onUserAdded={handleUserAdded}
          />
        </div>
      )}

      {/* Modal d'édition d'utilisateur */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EditUserModal
            user={editingUser}
            currentUser={user}
            onClose={() => setEditingUser(null)}
            onUserUpdated={handleUserUpdated}
          />
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
