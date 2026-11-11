import React from "react";
import WidgetCanvas from "./WidgetCanvas";

const USER_LAYOUT_LINK = {
  link_app: "home",
  link_name: "user",
} as const;

const userHome: React.FC = () => {
  return <WidgetCanvas fileLink={USER_LAYOUT_LINK} />;
};

export default userHome;
