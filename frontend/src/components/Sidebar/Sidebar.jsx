import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";

const Sidebar = ({ username, onLogout, onSelectChat, activeChat }) => {
  const [expandedMenus, setExpandedMenus] = useState({
    favorite: true,
    intermodal: false,
  });

  const [favoritedItems, setFavoritedItems] = useState(new Set());

  // Load favorited items from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoritedItems");
    if (savedFavorites) {
      setFavoritedItems(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const intermodalMenu = [
    "Road Transportation",
    "Air Freight",
    "Sea Freight",
    "Rail Freight",
    "Freight Forwarding",
  ];

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // Modifikasi fungsi toggleFavorite
  const toggleFavorite = (item, e) => {
    e.stopPropagation();
    const newFavorites = new Set(favoritedItems);

    if (newFavorites.has(item)) {
      newFavorites.delete(item);
      // Jika tidak ada item favorit tersisa, biarkan collapse tetap sesuai toggle user
      if (newFavorites.size === 0) {
        setExpandedMenus((prev) => ({
          ...prev,
          favorite: prev.favorite,
        }));
      }
    } else {
      newFavorites.add(item);
      // Otomatis buka collapse Obrolan Favorit saat ada item baru difavoritkan
      setExpandedMenus((prev) => ({
        ...prev,
        favorite: true,
      }));
    }

    setFavoritedItems(newFavorites);
    localStorage.setItem("favoritedItems", JSON.stringify([...newFavorites]));
  };

  return (
    <div className="hidden lg:flex w-[268px] bg-[#F8F8F8] p-3 flex-col justify-between">
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="pb-3 border-b-[1px] border-b-[#EBEBEB]">Sesuatu</div>

        {/* Favorite Chats Section */}
        <div>
          <div
            className={`flex items-center gap-3 p-2 hover:bg-[#D1E2FD] hover:rounded-lg transition-all duration-200 ${
              favoritedItems.size > 0 ? "cursor-pointer" : ""
            }`}
            onClick={() => favoritedItems.size > 0 && toggleMenu("favorite")}
          >
            <div className="rounded-[48px] border-[#EBEBEB] border-[1px] p-[9px] space-y-0">
              <img src="/icons/favourite-blue.svg" />
            </div>
            <span className="font-semibold text-[14px] leading-[16.8px] text-[#1B1B1B] items-center">
              Obrolan Favorit
            </span>
            {/* Hanya tampilkan chevron jika ada item favorit */}
            {favoritedItems.size > 0 && (
              <div className="ml-auto">
                {expandedMenus.favorite ? (
                  <ChevronDown className="w-5 h-5 text-[#1b1b1b]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#1b1b1b]" />
                )}
              </div>
            )}
          </div>

          {/* Favorited Items List */}
          {expandedMenus.favorite && favoritedItems.size > 0 && (
            <div className="ml-16 mt-2 space-y-2">
              {Array.from(favoritedItems).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-[#D1E2FD] hover:rounded-lg cursor-pointer transition-all duration-200"
                >
                  <span>{item}</span>
                  <Star
                    className="w-4 h-4 text-[#176cf7] fill-[#176cf7]"
                    onClick={(e) => toggleFavorite(item, e)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Intermodal Transportation */}
        <div>
          <div
            className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#D1E2FD] hover:rounded-lg transition-all duration-200"
            onClick={() => toggleMenu("intermodal")}
          >
            <div className="rounded-[48px] border-[#EBEBEB] border-[1px] p-[9px] space-y-0">
              <img src="/icons/favourite-blue.svg" />
            </div>
            <span className="font-semibold text-[14px] leading-[16.8px] text-[#1B1B1B] items-center">
              Transportasi Intermoda
            </span>
            <div className="ml-auto">
              {expandedMenus.intermodal ? (
                <ChevronDown className="w-5 h-5 text-[#1b1b1b]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#1b1b1b]" />
              )}
            </div>
          </div>

          {/* Submenu with Favorite Icons */}
          {expandedMenus.intermodal && (
            <div className="mt-2 ml-16 space-y-2">
              {intermodalMenu.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-[#D1E2FD] hover:rounded-lg cursor-pointer transition-all duration-200"
                >
                  <span>{item}</span>
                  <Star
                    className={`w-4 h-4 ${
                      favoritedItems.has(item)
                        ? "text-[#176cf7] fill-[#176cf7]"
                        : "text-gray-400 opacity-0 group-hover:opacity-100"
                    } transition-opacity cursor-pointer`}
                    onClick={(e) => toggleFavorite(item, e)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="pt-3 border-t-[1px] border-t-[#EBEBEB] flex flex-row justify-between items-center">
        <div className="flex flex-row gap-x-3 items-center">
          <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm">
            {username[0]?.toUpperCase()}
          </div>
          <span className="font-semibold text-sm font-[#1b1b1b]">
            {username}
          </span>
        </div>
        <span
          className="underline font-medium text-[12px] leading-[14.4px] text-[#176CF7] cursor-pointer"
          onClick={() => alert("ng profil")}
        >
          Ubah Nama
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
