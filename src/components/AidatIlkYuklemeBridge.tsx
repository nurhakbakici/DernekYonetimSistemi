import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

/** Girişte eksik aylık aidat kayıtlarını oluşturmak için aidat listesini bir kez yükler. */
export default function AidatIlkYuklemeBridge() {
  const { kullanici } = useAuth();
  const { aidatYukle } = useData();
  const ran = useRef(false);

  useEffect(() => {
    if (!kullanici?.id) {
      ran.current = false;
      return;
    }
    if (ran.current) return;
    ran.current = true;
    void aidatYukle();
  }, [aidatYukle, kullanici?.id]);

  return null;
}
