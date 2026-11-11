import React from "react";
import "@/index.css";

const Form = React.lazy(() => import("@/pages/Home"));

const FormApp: React.FC = () => (
  <React.Suspense fallback={null}>
    <Form />
  </React.Suspense>
);

export default FormApp;
