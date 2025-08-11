import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);
    try {
      const backendUrl = "http://127.0.0.1:8000/api/user/forgot-password";
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to send reset link.");
      }
      setMessage(
        result.message ||
          "If an account with that email exists, a password reset link has been sent."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Forgot Password
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email and we'll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email-forgot"
              className="block mb-2 font-semibold text-gray-700"
            >
              Email
            </label>
            <input
              id="email-forgot"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
          <div className="text-center mt-4 text-sm">
            <Link
              to="/login"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              &larr; Back to Login
            </Link>
          </div>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
