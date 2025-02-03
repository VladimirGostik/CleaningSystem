import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-1/6 bg-green-500 min-h-screen text-white shadow-lg p-2 pt-2 px-2 rounded-2xl h-full">
      <nav className="flex flex-col">
        <Link
          to="/admin-dashboard"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded mb-1"
        >
          <img
            src="/images/graph.png"
            alt="Graph"
            className="w-5 h-5 rounded-full"
          /> 
          Prehľad
        </Link>
        <Link
          to="/invoices"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded mb-1"
        >
          <img
            src="/images/checklist.png"
            alt="Checklist"
            className="w-5 h-5 rounded-full"
          /> 
          Faktúry
        </Link>
        <Link
          to="/monthly-invoices"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded mb-1"
        >
          <img
            src="/images/monthly-bill.png"
            alt="Monthly-invoices"
            className="w-5 h-5 rounded-full"
          /> 
          Mesačné faktúry
        </Link>
        <Link
          to="/residential-companies"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded mb-1"
        >
          <img
            src="/images/home.png"
            alt="Home"
            className="w-5 h-5 rounded-full"
          /> 
          Bytové podniky
        </Link>
        <Link
          to="/expanses"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded mb-1"
        >
          <img
            src="/images/money.png"
            alt="Money"
            className="w-5 h-5 rounded-full"
          /> 
          Výdavky
        </Link>
        <Link
          to="/employees"
          className="flex items-center gap-2 hover:bg-green-700 transition duration-300 p-1.5 rounded"
        >
          <img
            src="/images/employes.png"
            alt="Employes"
            className="w-5 h-5"
          /> 
          Zamestnanci
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;