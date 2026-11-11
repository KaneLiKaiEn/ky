import React, { useEffect, useRef, useState } from "react";
import "@/index.css";
import { mockInPatientList } from "@/pages/InPatientList/data";
import type { VisitItemRow } from "@/pages/VisitItem";

const InPatientList = React.lazy(() => import("@/pages/InPatientList/index"));

const InPatientListApp: React.FC = () => {
  const [activeId, setActiveId] = useState(mockInPatientList[0]?.visit_id ?? 0);

  const handleSelect = (item: VisitItemRow) => {
    setActiveId(item.visit_id);
  };

  return (
    <div className="h-screen">
      <React.Suspense fallback={null}>
        <InPatientList
          dept_id={11011220}
          collapsed={true}
          activeId={activeId}
          onSelect={handleSelect}
        />
      </React.Suspense>
    </div>
  );
};

export default InPatientListApp;
