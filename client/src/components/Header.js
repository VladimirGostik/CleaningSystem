import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Header = ({ onOpenModal }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Pridali sme useState pre showProfileMenu
  const { user, logoutHandler } = useAuth();
  const navigate = useNavigate();

  return (
    <header className=" flex items-center justify-between px-6 py-4 bg-gray-200 bg-opacity-50 backdrop-blur-md z-40">
      <div className="text-green-600 text-2xl font-bold">
        Cleaning System
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex items-center bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition duration-300"
          onClick={onOpenModal}
        >
          + Nový
        </button>
        <div className="relative">
          <span
            className="text-black font-medium cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user?.username}
          </span>
          <img
            src="/images/profile.png" // Cesta k uloženej ikone profilu
            alt="Profile"
            className="w-10 h-10 rounded-full ml-3 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-2">
              <button
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                onClick={() => {
                  logoutHandler();
                  navigate('/');
                }}
              >
                Odhlásiť sa
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
