import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Phone, Building, MapPin, Camera } from 'lucide-react';

const Profile = () => {
  const { isDark } = useTheme();
  const [profileImage, setProfileImage] = useState(null);
  
  // Mock user data - replace with actual user data in production
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    company: 'Tech Corp',
    location: 'San Francisco, CA'
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-200">User Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  {userData.name.charAt(0)}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-light hover:bg-primary-dark text-white p-2 rounded-full cursor-pointer transition-colors">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{userData.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Software Engineer</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-800 dark:text-gray-200">{userData.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-gray-800 dark:text-gray-200">{userData.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                <p className="text-gray-800 dark:text-gray-200">{userData.company}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-gray-800 dark:text-gray-200">{userData.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;