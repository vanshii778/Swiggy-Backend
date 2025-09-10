import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../utils/UserContext";
import ChangePassword from "./ChangePassword";
import apiService from "../utils/apiService";

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addresses: [],
    profile_picture: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [previewPic, setPreviewPic] = useState(null);
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const { setUserName } = useContext(UserContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile...");
        const result = await apiService.getProfile();
        console.log("Profile API response:", result);
        setProfile(result);
        setFormData({
          name: result.name || "",
          phone: result.phone || "",
          addresses: result.addresses || [],
          profile_picture: result.profile_picture || null,
        });
        setPreviewPic(result.profile_picture || null);
        console.log("Profile set successfully:", result);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    const fetchOrders = async () => {
      try {
        // TODO: Replace with real API call
        setOrders([]);
      } catch {}
    };
    const fetchFavorites = async () => {
      try {
        // TODO: Replace with real API call
        setFavorites([]);
      } catch {}
    };
    const fetchNotifications = async () => {
      try {
        // TODO: Replace with real API call
        setNotifications([]);
      } catch {}
    };
    fetchProfile();
    fetchOrders();
    fetchFavorites();
    fetchNotifications();
  }, []);

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

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profile_picture: file });
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    try {
      let payload;
      if (formData.profile_picture) {
        payload = new FormData();
        payload.append("name", formData.name);
        payload.append("phone", formData.phone);
        payload.append("profile_picture", formData.profile_picture);
        payload.append(
          "addresses",
          JSON.stringify(
            formData.addresses.filter((addr) => addr.street_address)
          )
        );
      } else {
        payload = {
          name: formData.name,
          phone: formData.phone,
          addresses: formData.addresses.filter((addr) => addr.street_address),
        };
      }
      const result = await apiService.updateProfile(payload);
      setUserName(result.name);
      setIsEditing(false);
      setProfile(result);
      setPreviewPic(result.profile_picture || null);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Debug log
  console.log("Profile component state:", { loading, error, profile });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Profile Found</h2>
          <p className="text-gray-600 mb-4">Unable to load profile data.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { label: "Profile Info", icon: "👤" },
    { label: "My Orders", icon: "📦" },
    { label: "Addresses", icon: "🏠" },
    { label: "Favorites", icon: "❤️" },
    { label: "Payment Methods", icon: "💳" },
    { label: "Notifications", icon: "🔔" },
    { label: "Security", icon: "🔒" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header with user info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=407A92&color=fff`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">{profile.phone} • {profile.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              EDIT PROFILE
            </button>
          </div>
        </div>
        
        {/* Main content with sidebar */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => setTab(idx)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    tab === idx
                      ? "bg-orange-50 text-orange-600 border-r-2 border-orange-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                onClick={async () => {
                  await apiService.logout();
                  navigate("/login");
                }}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="text-lg mr-3">🚪</span>
                Logout
              </button>
            </nav>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {/* Profile Info Tab */}
            {tab === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{profile.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{profile.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                    <img
                      src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.name}&background=407A92&color=fff`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* My Orders Tab */}
            {tab === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">When you place your first order, it will appear here.</p>
                  <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                    Start ordering
                  </button>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Manage Addresses</h2>
                {formData.addresses.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">🏠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                    <p className="text-gray-600 mb-4">Add your home, work or any other address for faster checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.addresses.map((address, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <h4 className="font-semibold text-orange-600 mb-2">{address.type || "Home"}</h4>
                            <input
                              type="text"
                              className="w-full mb-2 px-3 py-2 border rounded-lg text-sm"
                              placeholder="Street Address"
                              value={address.street_address || ""}
                              onChange={e => {
                                const updated = [...formData.addresses];
                                updated[idx].street_address = e.target.value;
                                setFormData({ ...formData, addresses: updated });
                              }}
                            />
                            <input
                              type="text"
                              className="w-full mb-2 px-3 py-2 border rounded-lg text-sm"
                              placeholder="City"
                              value={address.city || ""}
                              onChange={e => {
                                const updated = [...formData.addresses];
                                updated[idx].city = e.target.value;
                                setFormData({ ...formData, addresses: updated });
                              }}
                            />
                            <input
                              type="text"
                              className="w-full mb-2 px-3 py-2 border rounded-lg text-sm"
                              placeholder="State"
                              value={address.state || ""}
                              onChange={e => {
                                const updated = [...formData.addresses];
                                updated[idx].state = e.target.value;
                                setFormData({ ...formData, addresses: updated });
                              }}
                            />
                            <input
                              type="text"
                              className="w-full mb-2 px-3 py-2 border rounded-lg text-sm"
                              placeholder="Zip Code"
                              value={address.zip_code || ""}
                              onChange={e => {
                                const updated = [...formData.addresses];
                                updated[idx].zip_code = e.target.value;
                                setFormData({ ...formData, addresses: updated });
                              }}
                            />
                          </div>
                          <div className="flex flex-col space-y-2 items-end">
                            <button
                              className="text-green-600 text-sm font-medium hover:underline"
                              onClick={() => {
                                // Save address changes (PUT profile)
                                apiService.updateProfile({ addresses: formData.addresses });
                              }}
                            >
                              SAVE
                            </button>
                            <button
                              className="text-red-600 text-sm font-medium hover:underline"
                              onClick={() => {
                                const updated = formData.addresses.filter((_, i) => i !== idx);
                                setFormData({ ...formData, addresses: updated });
                                apiService.updateProfile({ addresses: updated });
                              }}
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleAddAddress}
                  className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Add New Address
                </button>
              </div>
            )}

            {/* Favorites Tab */}
            {tab === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Favorites</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">❤️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600 mb-4">Save your favorite restaurants and dishes for quick access.</p>
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {tab === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods added</h3>
                  <p className="text-gray-600 mb-4">Add your cards, UPI, or wallets for faster checkout.</p>
                  <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {tab === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Order Updates</h4>
                      <p className="text-sm text-gray-600">Get notified about your order status</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Promotional Offers</h4>
                      <p className="text-sm text-gray-600">Receive offers and discounts</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Get SMS updates for orders</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {tab === 6 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Account Security</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Change Password</h4>
                    <p className="text-gray-600 text-sm mb-4">Update your password regularly for better security</p>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Change Password
                    </button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Login Activity</h4>
                    <p className="text-gray-600 text-sm">View your recent login activity and active sessions</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Two-Factor Authentication</h4>
                    <p className="text-gray-600 text-sm">Add an extra layer of security to your account</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePassword onClose={() => setIsPasswordModalOpen(false)} />
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserProfile;
