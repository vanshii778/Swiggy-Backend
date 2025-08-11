import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../utils/UserContext";
import ChangePassword from "./ChangePassword";

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    addresses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const navigate = useNavigate();
  const { setUserName } = useContext(UserContext);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/user/user-profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch profile");
        }
        const result = await response.json();
        if (result.success) {
          const profileData = result.data;
          setProfile(profileData);
          setFormData({
            name: profileData.name,
            phone_number: profileData.phone_number || "",
            addresses: profileData.addresses || [],
          });
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddressChange = (e, index) => {
    const { name, value } = e.target;
    const newAddresses = [...formData.addresses];
    newAddresses[index][name] = value;
    setFormData({ ...formData, addresses: newAddresses });
  };

  const handleAddAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...formData.addresses,
        { street_address: "", city: "", state: "", zip_code: "" },
      ],
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    const token = localStorage.getItem("userToken");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/user/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            phone_number: formData.phone_number,
            addresses: formData.addresses.filter((addr) => addr.street_address),
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile.");
      }
      const result = await response.json();
      if (result.success) {
        setUserName(result.data.name);
        setIsEditing(false);
        setProfile(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading)
    return <div className="text-center p-10">Loading profile...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!profile)
    return <div className="text-center p-10">No profile data found.</div>;

  return (
    <>
      <div className="max-w-2xl mx-auto my-10 bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>
        {!isEditing ? (
          <div>
            <div className="space-y-4">
              <p>
                <strong>Name:</strong> {profile.name}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Phone:</strong> {profile.phone_number || "Not provided"}
              </p>
              <div className="pt-2">
                <h3 className="font-bold text-lg">Addresses</h3>
                {profile.addresses && profile.addresses.length > 0 ? (
                  profile.addresses.map((address, index) => (
                    <div key={index} className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p>{address.street_address}</p>
                      <p>
                        {address.city}, {address.state} {address.zip_code}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No address provided.</p>
                )}
              </div>
            </div>
            <div className="mt-6 text-center flex justify-center space-x-4">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
              >
                Change Password
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-lg mb-2">Addresses</h3>
              {formData.addresses.map((address, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 border rounded-lg mb-4"
                >
                  <input
                    type="text"
                    name="street_address"
                    placeholder="Street Address"
                    value={address.street_address}
                    onChange={(e) => handleAddressChange(e, index)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => handleAddressChange(e, index)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => handleAddressChange(e, index)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="zip_code"
                    placeholder="Zip Code"
                    value={address.zip_code}
                    onChange={(e) => handleAddressChange(e, index)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAddress}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                + Add New Address
              </button>
            </div>

            <div className="mt-6 flex justify-between space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (profile)
                    setFormData({
                      ...profile,
                      phone_number: profile.phone_number || "",
                      addresses: profile.addresses || [],
                    });
                }}
                className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
      {isPasswordModalOpen && (
        <ChangePassword onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </>
  );
};

export default UserProfile;
