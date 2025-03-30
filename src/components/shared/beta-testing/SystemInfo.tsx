
import React from 'react';

interface SystemInfoProps {
  systemInfo: {
    url: string;
    userAgent: string;
    timestamp: string;
    viewportSize: string;
    referrer: string;
  } | null;
}

export function SystemInfo({ systemInfo }: SystemInfoProps) {
  if (!systemInfo) return null;
  
  return (
    <div className="space-y-2 bg-gray-50 p-3 rounded text-sm">
      <p className="font-medium">System Information (Automatically Collected)</p>
      <div className="grid grid-cols-2 gap-2 text-gray-600">
        <p>Page: {systemInfo.url}</p>
        <p>Time: {new Date(systemInfo.timestamp).toLocaleString()}</p>
        <p>Screen: {systemInfo.viewportSize}</p>
        <p>Referred from: {systemInfo.referrer}</p>
      </div>
    </div>
  );
}
