import React, { useCallback, useEffect, useMemo, useState } from "react";

const Test: React.FC<{ visit_id: number }> = ({ visit_id }) => {
  return <div>Test {visit_id}</div>;
};

export default Test;
