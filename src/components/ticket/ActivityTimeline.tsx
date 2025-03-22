import React from "react";

interface ActivityNote {
  action: string;
  user: string;
  timestamp: string;
  comment?: string;
}

interface ActivityTimelineProps {
  notes: ActivityNote[] | null;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ notes }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
        <p className="text-gray-500 italic">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
      <div className="space-y-2 text-sm pl-4 border-l-2 border-gray-200">
        {notes.map((activity, index) => (
          <div key={index} className="relative pl-4 pb-2">
            <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px]"></div>
            <p className="font-medium">{activity.action}</p>
            <p className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()} by {activity.user}
            </p>
            {activity.comment && (
              <p className="mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                {activity.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
