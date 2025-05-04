import React from 'react';
import { FadeIn } from '../../components/animations';
import Navbar from '../../components/layout/Navbar';

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <FadeIn>
          <h1 className="text-4xl font-bold text-primary-900 dark:text-primary-100 mb-6">
            个人资料
          </h1>
        </FadeIn>
      </div>
    </div>
  );
};

export default Profile;