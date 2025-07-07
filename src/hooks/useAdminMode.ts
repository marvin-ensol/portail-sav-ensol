import { useState, useEffect } from "react";

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    setIsAdminMode(adminParam === 'true');
  }, []);

  return isAdminMode;
};