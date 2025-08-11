import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_new_password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.new_password !== formData.confirm_new_password) {
      setError("New passwords do not match.");
      return;
    }
    setMessage("");
    setIsLoading(true);
    try {
      const backendUrl = `http://127.0.0.1:8000/api/user/reset-password`;
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: formData.new_password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to reset password.");
      }
      setMessage(
        "Password has been reset successfully! Redirecting to login..."
      );
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Reset Your Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">New Password</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirm_new_password"
              value={formData.confirm_new_password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
        {message && (
          <p className="mt-4 text-center text-sm text-green-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
