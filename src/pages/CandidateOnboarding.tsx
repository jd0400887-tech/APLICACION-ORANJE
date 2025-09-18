import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext is in src/context
import { addCandidate, Candidate } from '../data/database'; // Assuming addCandidate is in src/data/database

const CandidateOnboarding: React.FC = () => {
  const { user } = useAuth(); // Get the authenticated user
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Omit<Candidate, 'id' | 'isBlacklisted'>>({
    name: '',
    email: user?.email || '', // Pre-fill email if available from auth
    dob: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    zip: '',
    address: '',
    position: '',
    imageUrl: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      // If no user is logged in, redirect to login or register
      navigate('/register'); // Or '/login'
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('No user logged in. Please register or log in.');
      setLoading(false);
      return;
    }

    try {
      // Add isBlacklisted with a default value
      const candidateData: Omit<Candidate, 'id'> = {
        ...formData,
        isBlacklisted: false, // Default to false for new candidates
      };

      const result = await addCandidate(candidateData);

      if (result) {
        console.log('Candidate added successfully:', result);
        // Redirect to a success page or dashboard
        navigate('/candidate-dashboard'); // Assuming a dashboard for candidates
      } else {
        setError('Failed to add candidate. Please try again.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center">Completa tu Perfil de Candidato</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          {/* Name */}
          <div className="mt-4">
            <label className="block" htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              placeholder="Tu Nombre"
              name="name"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="mt-4">
            <label className="block" htmlFor="email">Email</label>
            <input
              type="email"
              placeholder="Email"
              name="email"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.email}
              onChange={handleChange}
              required
              disabled // Email is pre-filled from auth, can be made editable if needed
            />
          </div>

          {/* DOB */}
          <div className="mt-4">
            <label className="block" htmlFor="dob">Fecha de Nacimiento</label>
            <input
              type="date"
              name="dob"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="mt-4">
            <label className="block" htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              placeholder="Número de Teléfono"
              name="phone"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Country */}
          <div className="mt-4">
            <label className="block" htmlFor="country">País</label>
            <input
              type="text"
              placeholder="País"
              name="country"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.country} 
              onChange={handleChange}
              required
            />
          </div>

          {/* State */}
          <div className="mt-4">
            <label className="block" htmlFor="state">Estado/Provincia</label>
            <input
              type="text"
              placeholder="Estado/Provincia"
              name="state"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>

          {/* City */}
          <div className="mt-4">
            <label className="block" htmlFor="city">Ciudad</label>
            <input
              type="text"
              placeholder="Ciudad"
              name="city"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          {/* Zip */}
          <div className="mt-4">
            <label className="block" htmlFor="zip">Código Postal</label>
            <input
              type="text"
              placeholder="Código Postal"
              name="zip"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.zip}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address */}
          <div className="mt-4">
            <label className="block" htmlFor="address">Dirección</label>
            <input
              type="text"
              placeholder="Dirección Completa"
              name="address"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          {/* Position */}
          <div className="mt-4">
            <label className="block" htmlFor="position">Posición Deseada</label>
            <input
              type="text"
              placeholder="Ej: Limpieza, Recepcionista"
              name="position"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.position}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image URL (for now, a text input) */}
          <div className="mt-4">
            <label className="block" htmlFor="imageUrl">URL de la Imagen de Perfil (Opcional)</label>
            <input
              type="url"
              placeholder="https://example.com/your-image.jpg"
              name="imageUrl"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex items-baseline justify-between mt-6">
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateOnboarding;
