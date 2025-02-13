import React, { useState } from "react";
import { FaHome, FaBars, FaTimes, FaClipboardList } from "react-icons/fa";
import { MdAddAPhoto } from "react-icons/md";
import { NavLink } from "react-router-dom";

const SideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`fixed h-screen ${isOpen ? "sm:w-64 w-52" : "w-0"} bg-zinc-950 text-white gap-4 flex flex-col transition-all duration-300 z-50`}
    >
      <div className="flex flex-col mr-12">
        {/* Header */}
        <div
          className={`p-2 text-2xl font-semibold flex flex-col items-center ${!isOpen && "hidden"}`}
        >
          <div className="mt-8">ZKAuction</div>
          <button
            onClick={toggleSidebar}
            className="text-4xl mt-7 ml-1 absolute top-4 right-4"
          >
            <FaTimes />
          </button>
        </div>
        {/* Navigation links */}
        <div
          className={`flex flex-col space-y-4 gap-8 p-4 ${!isOpen && "hidden"}`}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "flex group items-center space-x-2 p-2 bg-blue-500 rounded-md"
                : "flex items-center space-x-2 p-2 hover:bg-blue-500 rounded-md"
            }
          >
            <FaHome className="text-xl group-hover:text-white" />
            <span className="group-hover:text-white">Home</span>
          </NavLink>
          <NavLink
            to="/auction"
            className={({ isActive }) =>
              isActive
                ? "flex group items-center space-x-2 p-2 bg-blue-500 rounded-md"
                : "flex items-center space-x-2 p-2 hover:bg-blue-500 rounded-md"
            }
          >
            <FaClipboardList className="text-xl group-hover:text-white" />
            <span className="group-hover:text-white">Auction</span>
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 p-2 bg-blue-500 rounded-md"
                : "flex items-center space-x-2 p-2 hover:bg-blue-500 rounded-md"
            }
          >
            <MdAddAPhoto className="text-xl mb-1" />
            <span>Create</span>
          </NavLink>
        </div>
      </div>
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="text-2xl p-2 bg-black text-white fixed top-4 left-4 z-50 mb-2"
        >
          <FaBars />
        </button>
      )}
    </div>
  );
};

export default SideBar;
