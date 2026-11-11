import echarts from "../../assets/preview/echarts.min.js?url";
import gl from "../../assets/preview/echarts-gl.min.js?url";
import liquid from "../../assets/preview/echarts-liquidfill.min.js?url";
import wordcloud from "../../assets/preview/echarts-wordcloud.min.js?url";
import d3 from "../../assets/preview/d3.min.js?url";
import plot from "../../assets/preview/plot.umd.min.js?url";

// Resolve against the remote module, including when Host and board have different origins.
export const runtimeScripts = [echarts, gl, liquid, wordcloud, d3, plot].map(
  (url) => new URL(url, import.meta.url).href,
);
