import { init, use } from "echarts/core";
import {
  BarChart,
  LineChart,
  TreemapChart,
  ScatterChart,
  GaugeChart,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  DatasetComponent,
  TitleComponent,
} from "echarts/components";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
use([
  BarChart,
  LineChart,
  TreemapChart,
  ScatterChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  DatasetComponent,
  TitleComponent,
  UniversalTransition,
  CanvasRenderer,
]);
export { init };
