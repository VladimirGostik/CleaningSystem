import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import AddNewModal from '../modals/AddNewModal';

const AdminLayout = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-200 pl-2 min-h-screen flex flex-col">
      {/* Header */}
      <Header onOpenModal={() => setShowModal(true)} />
  
      <div className="flex flex-grow min-h-screen relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 left-4 z-50 bg-green-600 text-white p-2 rounded-md shadow-lg hover:bg-green-700 transition"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar - hidden on mobile by default, fixed width on desktop */}
        <div className={`
          fixed md:relative md:block
          ${sidebarOpen ? 'block' : 'hidden'}
          z-40 md:z-auto
        `}>
          <Sidebar onLinkClick={() => setSidebarOpen(false)} />
        </div>
  
        {/* Main content - takes remaining space */}
        <main className="flex-grow p-4 w-full md:w-auto">
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