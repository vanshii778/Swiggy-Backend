import React, { useState } from "react";

const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (formData.new_password !== formData.confirm_new_password) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("userToken");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/user/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: formData.current_password,
            new_password: formData.new_password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to change password.");
      }

      setMessage("Password changed successfully!");
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">Current Password</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
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

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          {message && (
            <p className="text-center text-sm text-green-600">{message}</p>
          )}

          <div className="flex justify-between space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-1/2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
