import React, { useState, useEffect } from 'react';

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('userToken');
            if (!token) {
                setError("No authorization token found.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:8000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || "Failed to fetch profile");
                }
                setProfile(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="text-center p-10">Loading profile...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    if (!profile) return <div className="text-center p-10">No profile data found.</div>;

    return (
        <div className="max-w-2xl mx-auto my-10 bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>
            <div className="space-y-4">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.phone_number || 'Not provided'}</p>
                <div className="pt-2">
                    <h3 className="font-bold text-lg">Address</h3>
                    {profile.addresses && profile.addresses.length > 0 ? (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                            <p>{profile.addresses[0].street_address}</p>
                            <p>{profile.addresses[0].city}, {profile.addresses[0].state} {profile.addresses[0].zip_code}</p>
                        </div>
                    ) : (
                        <p>No address provided.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
