import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import AddNewModal from '../modals/AddNewModal';

const AdminLayout = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-gray-200 pl-2 min-h-screen flex flex-col">
      {/* Header */}
      <Header onOpenModal={() => setShowModal(true)} />
  
      <div className="flex flex-grow min-h-screen">
        {/* Sidebar */}
        <Sidebar />
  
        {/* Main content */}
        <main className="flex-grow p-4">
          <div className="w-full mx-auto">{children}</div>
        </main>
      </div>
  
      {showModal && (
        <AddNewModal closeModal={() => setShowModal(false)} />
      )}
    </div>
  );
  
};

export default AdminLayout;