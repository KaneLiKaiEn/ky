import React, { useMemo } from "react";
import WidgetCanvas from "../userHome/WidgetCanvas";

export interface VisitHomeProps {
  visit_id?: number;
}

const visitHome: React.FC<VisitHomeProps> = ({ visit_id }) => {
  const fileLink = useMemo(
    () => ({
      link_app: "home",
      link_name: "visit",
      link_data: String(visit_id ?? 0),
    }),
    [visit_id],
  );

  const params = {
    visit_id,
  };

  return (
    <WidgetCanvas fileLink={fileLink} params={params} enableDefaultLayout />
  );
};

export default visitHome;
