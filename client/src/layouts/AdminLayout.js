import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import AddNewModal from '../modals/AddNewModal';

const AdminLayout = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-gray-200 min-h-screen relative">
      {/* Header */}
      <Header onOpenModal={() => setShowModal(true)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-grow ml-[20%] p-2">
          <div className="w-full mx-auto pr-4">
            {children}
          </div>
        </main>
      </div>

      {showModal && (
        <AddNewModal closeModal={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default AdminLayout;
