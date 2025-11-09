import React, { useState } from "react";
import { usersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const AddUserForm = ({ onClose, onUserAdded }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "employee",
    department: "",
    phone: "",
  });

  const roles = [
    { value: "employee", label: "Personnel" },
    { value: "mg", label: "Moyen Général" },
    { value: "accounting", label: "Comptabilité" },
    { value: "director", label: "Directeur" },
  ];

  const departments = [
    "Service Développement",
    "Service Communication",
    "Service Pédagogique",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Réinitialiser les messages d'erreur
    if (error) setError("");
    if (success) setSuccess(null);
  };

  const handleSubmit = async () => {
    // Validation simple
    if (
      !formData.username ||
      !formData.email ||
      !formData.first_name ||
      !formData.last_name
    ) {
      setError("Veuillez remplir tous les champs obligatoires");
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

      // Notifier le parent
      if (onUserAdded) {
        onUserAdded(response.data);
      }

      // Réinitialiser le formulaire
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "employee",
        department: "",
        phone: "",
      });
    } catch (err) {
      console.error("Erreur lors de la création:", err);

      if (err.response?.data) {
        // Gérer les erreurs de validation
        const errorData = err.response.data;

        if (typeof errorData === "object" && !errorData.error) {
          // Erreurs de champs spécifiques
          const fieldErrors = Object.entries(errorData)
            .map(
              ([field, errors]) =>
                `${field}: ${
                  Array.isArray(errors) ? errors.join(", ") : errors
                }`
            )
            .join("\n");
          setError(fieldErrors);
        } else {
          setError(
            errorData.error || "Erreur lors de la création de l'utilisateur"
          );
        }
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifier les permissions
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
            <User className="h-5 w-5 mr-2" />
            Ajouter un nouvel utilisateur
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Message de succès */}
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
                    ⚠️ Le mot de passe sera envoyé par mail à l'utilisateur
                    concerné de manière sécurisée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <div className="text-red-800">
                <pre className="whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Informations personnelles */}
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

          {/* Informations professionnelles */}
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
                  {roles.map((role) => (
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
                    {departments.map((dept) => (
                      <button
                        type="button"
                        key={dept}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            department: dept,
                          }))
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          formData.department === dept
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Service personnalisé (ex: Service Innovation)"
                  />
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

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
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

export default AddUserForm;
